"""LLM Message Dispatcher Tool"""

import asyncio
from datetime import datetime
import os
from bson import ObjectId # type: ignore
from dotenv import load_dotenv # type: ignore
from fastapi import FastAPI, HTTPException # type: ignore
from pydantic import BaseModel # type: ignore
from pymongo import MongoClient # type: ignore
from pymongo.server_api import ServerApi # type: ignore
from together import Together # type: ignore

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
collection = db["messages"]

# Client connection
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
together_client = Together(api_key=TOGETHER_API_KEY)

app = FastAPI()

class Message(BaseModel):
    """Class for user messages"""
    models: list[str]
    messages: list
    temperature: float
    max_tokens: int | None

    def to_dict(self) -> dict:
        """Returns the API request as a dictionary"""
        return {
            "models": self.models,
            "messages": self.messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }

async def call_model(model, message: Message):
    """Sends message to a specific model"""
    try:
        response = together_client.chat.completions.create(
            model=model,
            messages=message.messages,
            temperature=message.temperature,
            max_tokens=message.max_tokens
        )
        # print({"response": response.choices[0].message.content})
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

async def store_message(message: Message, responses):
    """Stores message in MongoDB"""

    document = {
        "messages": message.messages,
        "responses": responses,
        "temperature": message.temperature,
        "max_tokens": message.max_tokens,
        "timestamp": datetime.now()
    }

    result = collection.insert_one(document)
    return {"message": "Stored successfully", "id": str(result.inserted_id)}

@app.post("/send_message")
async def send_message(message: Message):
    """Accepts a JSON containing a user/system message and dispatches it to LLMs"""
    tasks = [call_model(model, message) for model in message.models]

    responses = await asyncio.gather(*tasks)
    await store_message(message, responses)

    return responses

@app.get("/messages")
async def get_messages():
    """Returns all messages by ID"""
    message_ids = [str(document["_id"]) for document in collection.find()]

    return message_ids

@app.get("/messages/{message_id}")
async def get_message(message_id: str):
    """Returns a message from its ID"""
    document = collection.find_one({"_id": ObjectId(message_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Message not found")

    document["_id"] = str(document["_id"])
    return document

# {
#   "models": [
#     "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
#     "black-forest-labs/FLUX.1-schnell-Free",
#     "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
#   ],
#   "messages": [
#     {
#       "role": "system",
#       "content": "Be abstract"
#     },
#     {
#       "role": "user",
#       "content": "What is the meaning of life?"
#     }
#   ],
#   "temperature": 0.5,
#   "max_tokens": 200
# }
