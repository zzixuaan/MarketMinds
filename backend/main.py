#fastapi
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "fastAPI is running"}


#finnhub
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("FINNHUB_API_KEY")

print(API_KEY)