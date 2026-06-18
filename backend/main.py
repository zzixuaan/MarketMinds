#fastapi

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.journal_routes import router as journal_router


load_dotenv()

app = FastAPI(
    title="Paper Trading API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(journal_router)


FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")


@app.get("/")
async def root():
    return {
        "message": "FastAPI is running",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "finnhubConfigured": bool(FINNHUB_API_KEY),
    }




#from fastapi import FastAPI

#app = FastAPI()


#@app.get("/")
#async def root():
    return {"message": "fastAPI is running"}


#finnhub
#from dotenv import load_dotenv
#import os

#load_dotenv()

#API_KEY = os.getenv("FINNHUB_API_KEY")

#print(API_KEY)*/