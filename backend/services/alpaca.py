import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ALPACA_API_KEY")
SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")

BASE_URL = "https://data.alpaca.markets/v2"


def get_candles(symbol: str):

    headers = {
        "APCA-API-KEY-ID": API_KEY,
        "APCA-API-SECRET-KEY": SECRET_KEY
    }

    url = (
        f"{BASE_URL}/stocks/{symbol.upper()}/bars"
        f"?timeframe=1Day"
        f"&limit=30"
        f"&adjustment=raw"
        f"&feed=iex"
    )

    response = requests.get(url, headers=headers)

    return response.json()