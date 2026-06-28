from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from typing import Any

from auth import get_current_user_id
from config.firebase_admin import db

router = APIRouter()


class TradeRequest(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: float
    total: float


@router.post("/trade")
def place_trade(
    trade: TradeRequest,
    user_id: str = Depends(get_current_user_id),
):

    try:
        trade_data = {
            "symbol": trade.symbol.upper(),
            "side": trade.side,
            "quantity": trade.quantity,
            "price": trade.price,
            "total": trade.quantity * trade.price,
            "created_at": firestore.SERVER_TIMESTAMP,
        }

        db.collection("users") \
          .document(user_id) \
          .collection("trades") \
          .add(trade_data)

        return {"success": True}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


def get_trade_entries(user_id: str) -> list[dict[str, Any]]:
    documents = (
        db.collection("users")
        .document(user_id)
        .collection("trades")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .stream()
    )

    return [
        {
            "id": doc.id,
            **doc.to_dict(),
        }
        for doc in documents
    ]


@router.get("/trade")
def list_entries(
    user_id: str = Depends(get_current_user_id),
):
    return get_trade_entries(user_id)