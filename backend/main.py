"""LLM Message Dispatcher Tool"""

import asyncio
import os

from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
collection = db["messages"]

# Client connection
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
together_client = Together(api_key=TOGETHER_API_KEY)

app = FastAPI()

origins = [
    "http://127.0.0.1:5173",  # React frontend URL
    "http://localhost:5173",   # Sometimes localhost can be used as the origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    """Class for user messages"""
    models: list[str]
    messages: list
    temperature: float
    max_tokens: int | None

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
        "models": message.models,
        "messages": message.messages,
        "responses": responses,
        "temperature": message.temperature,
        "max_tokens": message.max_tokens,
        "timestamp": datetime.now()
    }

    result = collection.insert_one(document)
    return str(result.inserted_id)

# GET
@app.get("/")
async def root():
    """Root check"""
    return {"message" : "LLM Message Dispatch Tool"}

@app.get("/messages")
async def get_messages():
    """Returns all message IDs"""
    message_ids = [str(document["_id"]) for document in collection.find({}, {"_id": 1})]
    return {"message_ids": message_ids}

@app.get("/messages/{message_id}")
async def get_message(message_id: str):
    """Returns a message by ID"""
    try:
        obj_id = ObjectId(message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message ID format")

    document = collection.find_one({"_id": obj_id})
    if not document:
        raise HTTPException(status_code=404, detail="Message not found")

    document["_id"] = str(document["_id"])
    return document

# POST
@app.post("/send-message")
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

# PUT/PATCH

# DELETE
@app.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    """Deletes a message by ID and returns confirmation"""
    try:
        obj_id = ObjectId(message_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid message ID format")

    result = collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")

    return {"message": f"Message {message_id} deleted successfully"}