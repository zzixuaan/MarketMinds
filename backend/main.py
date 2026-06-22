#fastapi

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.journal_routes import router as journal_router
from routes.search import router as search_router
from routes.market import router as market_router
from routes.chart import router as chart_router
from routes.trade import router as trade_router


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
app.include_router(search_router, prefix = "/api", tags = ["Search"])
app.include_router(market_router, prefix = "/api", tags = ["Market"])
app.include_router(chart_router, prefix = "/api", tags = ["Chart"])
app.include_router(trade_router, prefix = "/api", tags = ["Trade"])


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