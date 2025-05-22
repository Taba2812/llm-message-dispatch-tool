"""LLM Message Dispatcher Tool"""

import asyncio
import os
import sys

from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from dotenv import load_dotenv
from enum import Enum
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from together import Together

# uvicorn main:app --host 0.0.0.0 --port 8000 --reload

load_dotenv()

# MongoDB connection
DB_PASSWORD = os.getenv("DB_PASSWORD")
MONGO_URI = f"mongodb+srv://earlgibe:{DB_PASSWORD}@earlgibe.mmluw.mongodb.net"
CONNECTION_STRING = f"{MONGO_URI}/?retryWrites=true&w=majority&appName=EarlGibe"

mongo_client = MongoClient(
    CONNECTION_STRING, server_api=ServerApi(version="1", strict=True, deprecation_errors=True)
)

try:
    mongo_client.admin.command({'ping': 1})
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    raise RuntimeError(f"Failed to connect: {e}") from e

db = mongo_client["llm_message_dispatcher_tool"]
messages_collection = db["messages"]

# Client connection
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
together_client = Together(api_key=TOGETHER_API_KEY)

app = FastAPI()

origins = [
    "http://127.0.0.1:5173",  # React frontend URL
    "http://localhost:5173",  # Probably same but had some problems sometimes
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Role(str, Enum):
    system = "system"
    user = "user"

class ChatMessage(BaseModel):
    role: Role
    content: str

class Message(BaseModel):
    """Class for user messages"""
    models: list[str] = Field(default_factory=lambda: [
        "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
    ])
    messages: list[ChatMessage]
    temperature: float = 0.5
    max_tokens: int | None = None

    def to_dict(self):
        return [message.model_dump() for message in self.messages]

    @model_validator(mode="after")
    def check_required_roles(self):
        roles = {m.role for m in self.messages}
        if not {"system", "user"}.issubset(roles):
            raise ValueError("Messages must include both a 'system' and a 'user' role.")
        return self
    
system_prompt = (
    "First string"
    "Second string"
)

class ImageMessage(BaseModel):
    "Class for image prompt"
    model: str = "black-forest-labs/FLUX.1-schnell-Free"
    n: int = 1
    prompt: str
    steps: int = 4
    message_id: str

async def call_model(model, message: Message):
    """Sends message to a specific model"""
    try:
        response = together_client.chat.completions.create(
            model=model,
            messages=message.to_dict(),
            temperature=message.temperature,
            max_tokens=message.max_tokens
        )
        # print({"response": response.choices[0].message.content})
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

async def store_message(message: Message, responses: list):
    """Stores message in MongoDB"""

    document = {
        "models": message.models,
        "messages": message.to_dict(),
        "responses": responses,
        "temperature": message.temperature,
        "max_tokens": message.max_tokens,
        "timestamp": datetime.now()
    }

    try:
        result = messages_collection.insert_one(document)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    
    return str(result.inserted_id)

async def store_image(message_id: ObjectId, image_url: str):
    """Stores image in the database"""
    
    result = messages_collection.update_one(
        {"_id": message_id},
        {"$set": {"image_url": image_url}}
    )
    return message_id

# GET
@app.get("/", status_code=200)
async def root():
    """Root check"""
    return {"message" : "LLM Message Dispatch Tool"}

@app.get("/messages", status_code=200)
async def get_messages():
    """Returns all message IDs"""
    try:
        # message_ids = [str(document["_id"]) for document in messages_collectionfind({}, {"_id": 1})]
        messages = []
        for doc in messages_collection.find({}, {"_id": 1, "messages": 1, "timestamp": 1}):
            first_user_msg = next((m["content"] for m in doc["messages"] if m["role"] == "user"), "No user message")
            messages.append({
                "id": str(doc["_id"]),
                "preview": first_user_msg[:100],  # Truncate to 100 chars
                "timestamp": doc.get("timestamp")
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {e}")
    # return {"message_ids": message_ids}
    return {"messages": messages}

@app.get("/messages/{message_id}", status_code=200)
async def get_message(message_id: str):
    """Returns a message by ID"""
    try:
        obj_id = ObjectId(message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message ID format")

    try:
        document = messages_collection.find_one({"_id": obj_id})
        if not document:
            raise HTTPException(status_code=404, detail="Message not found")
        document["_id"] = str(document["_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch message: {e}")

    return document

# POST
@app.post("/send-message", status_code=201)
async def send_message(message: Message):
    """Accepts a JSON containing a user/system message and dispatches it to LLMs"""
    try:
        tasks = [call_model(model, message) for model in message.models]
        responses = await asyncio.gather(*tasks)

        message_id = await store_message(message, responses)

        return {
            "message_id": str(message_id),
            "responses": responses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {e}")

@app.post("/generate-image", status_code=201)
async def generate_image(message: ImageMessage):
    """Generates image based on LLM responses"""
    try:
        obj_id = ObjectId(message.message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message ID format")

    # Fetch message document
    document = messages_collection.find_one({"_id": obj_id})
    if not document:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Combine all model responses
    responses = document.get("responses", [])
    if not responses:
        raise HTTPException(status_code=400, detail="No responses found to generate image from")
    
    combined_prompt = "\n".join(responses)
    
    try:
        response = together_client.images.generate(
            model = message.model,
            n = message.n,
            prompt = message.prompt + combined_prompt,
            steps = message.steps,
        )

        image_url = response.data[0].url

        image_id = await store_image(obj_id, image_url)
        print(image_id)

        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Together API failed: {str(e)}")

# PUT/PATCH
# Messages are not supposed to be modified or updated

# DELETE
@app.delete("/messages/{message_id}", status_code=200)
async def delete_message(message_id: str):
    """Deletes a message by ID and returns confirmation"""
    try:
        obj_id = ObjectId(message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message ID format")

    try:
        result = messages_collection.delete_one({"_id": obj_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {e}")
            
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"message": f"Message {message_id} deleted successfully"}