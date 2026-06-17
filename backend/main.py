print("using main")

from fastapi import FastAPI

from services.finnhub import ( search_symbol, get_company_profile, get_quote, get_market_status )
from services.alpaca import ( get_candles )

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "MarketMinds API is running"}

@app.get("/search/{query}")
def search(query : str):
    return search_symbol(query)

@app.get("/company/{ticker}")
def company(ticker : str): 
    return get_company_profile(ticker)

@app.get ("/quote/{ticker}") 
def quote(ticker : str): 
    return get_quote(ticker)

@app.get("/market-status/{exchange}")
def market_status(exchange : str):
    return get_market_status(exchange)

@app.get("/chart/{ticker}")
def chart(ticker : str):
    return get_candles(ticker)



