import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FINNHUB_API_KEY")

BASE_URL = "https://finnhub.io/api/v1"

def search_symbol(query : str): 
    response = requests.get(
        f"{BASE_URL}/search",
        params={
            "q": query,
            "token": API_KEY
        }
    )
    return response.json()

def get_company_profile(symbol : str):
    response = requests.get(
        f"{BASE_URL}/stock/profile2",
        params={
            "symbol": symbol.upper(),
            "token": API_KEY
        }
    )
    return response.json()

def get_quote(symbol : str):
    response = requests.get(
        f"{BASE_URL}/quote",
        params={
            "symbol": symbol.upper(),
            "token": API_KEY
        }
    )
    return response.json()

def get_market_status(exchange : str):
    response = requests.get(
        f"{BASE_URL}/stock/market-status",
        params={
            "exchange": exchange.upper(),
            "token": API_KEY
        }
    )
    return response.json()

def get_market_news():
    response = requests.get(
        f"{BASE_URL}/news",
        params = {
            "category": "general",
            "token": API_KEY
        }
    )
    
    news = response.json()

    return [
        {
            "headline": article["headline"],
            "summary": article["summary"],
            "source": article["source"],
            "image": article["image"],
            "url": article["url"],
            "datetime": article["datetime"]

        }
        for article in news
    ]






