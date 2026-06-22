from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore

from config.firebase_admin import db, verify_token

router = APIRouter()

class TradeRequest(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: float


@router.post("/trade")
def place_trade(
    trade: TradeRequest,
    authorization: str = Header(None)
):

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    try:
        decoded = verify_token(token)
        uid = decoded["uid"]

        trade_data = {
            "symbol": trade.symbol.upper(),
            "side": trade.side,
            "quantity": trade.quantity,
            "price": trade.price,
            "total": trade.quantity * trade.price,
            "created_at": firestore.SERVER_TIMESTAMP,
        }

        db.collection("users") \
          .document(uid) \
          .collection("trades") \
          .add(trade_data)

        return {
            "success": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )