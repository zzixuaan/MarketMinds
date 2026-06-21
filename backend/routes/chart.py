from fastapi import APIRouter
from services.alpaca import get_candles

router = APIRouter()

@router.get("/chart/{symbol}")
def get_chart(symbol: str):
    return get_candles(symbol)