import os
import requests
from dotenv import load_dotenv

from alpaca.trading.client import TradingClient
from alpaca.data.historical.stock import StockHistoricalDataClient
from alpaca.data.requests import (StockSnapshotRequest, StockBarsRequest)
from alpaca.data.timeframe import TimeFrame

from datetime import datetime, timedelta


load_dotenv()

API_KEY = os.getenv("ALPACA_API_KEY")
SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")

BASE_URL = "https://data.alpaca.markets/v2"

trading_client = TradingClient(API_KEY, SECRET_KEY, paper = True)  
data_client = StockHistoricalDataClient(API_KEY, SECRET_KEY)

def get_market_clock():
    return trading_client.get_clock()

def get_market_indices():
    request = StockSnapshotRequest(
        symbol_or_symbols=["SPY", "QQQ", "DIA"]
    )
    return data_client.get_stock_snapshot(request)

from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from datetime import datetime, timedelta


def get_candles(symbol: str):

    request = StockBarsRequest(
        symbol_or_symbols=symbol.upper(),
        timeframe=TimeFrame.Day,
        start=datetime.now() - timedelta(days=60)
    )

    bars = data_client.get_stock_bars(request)

    return bars.df.reset_index().to_dict(orient="records")