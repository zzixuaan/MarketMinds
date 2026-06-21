from fastapi import APIRouter
from services.alpaca import (get_market_clock, get_market_indices)

router = APIRouter()

@router.get("/market-status")
def market_status():
    clock = get_market_clock()
    return {
        "is_open": clock.is_open,
        "next_open": str(clock.next_open),
        "next_close": str(clock.next_close)
    }

@router.get("/market-indices")
def market_indices():
    snapshots = get_market_indices()
    result = {}

    for symbol in ["SPY", "QQQ", "DIA"]:

        current = snapshots[symbol].latest_trade.price
        previous = snapshots[symbol].previous_daily_bar.close

        change_percent = (
            (current - previous)
            / previous
            * 100
        )

        result[symbol] = {
            "price": round(current, 2),
            "change_percent": round(change_percent, 2)
        }

    return result
