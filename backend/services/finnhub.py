import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FINNHUB_API_KEY")

BASE_URL = "https://finnhub.io/api/v1"

def search_symbol(query : str): 
    url = (
        f"{BASE_URL}/search"
        f"?q={query}"
        f"&token={API_KEY}"
    )
    response = requests.get(url)
    return response.json()

def get_company_profile(symbol : str):
    url = (
        f"{BASE_URL}/stock/profile2"
        f"?symbol={symbol.upper()}"
        f"&token={API_KEY}"
    )
    response = requests.get(url)
    return response.json()

def get_quote(symbol : str):
    url = (
        f"{BASE_URL}/quote"
        f"?symbol={symbol.upper()}"
        f"&token={API_KEY}"
    )
    response = requests.get(url)
    return response.json()

def get_market_status(exchange : str):
    url = (
        f"{BASE_URL}/stock/market-status"
        f"?exchange={exchange.upper()}"
        f"&token={API_KEY}"
    )
    response = requests.get(url)
    return response.json()







