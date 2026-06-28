from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from firebase_admin import firestore
from auth import get_current_user_id

from config.firebase_admin import db, verify_token

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
    


def get_trade_entries(
    user_id: str,
) -> list[dict[str, Any]]:
    documents = (
        db.collection("users")
        .document(user_id)
        .collection("trades")
        .order_by(
            "created_at",
            direction=firestore.Query.DESCENDING,
        )
        .stream()
    )

    return [
        {
            "id": trade_document.id,
            **trade_document.to_dict(),
        }
        for _document in documents
    ]

    

@router.get("/trade")
async def list_entries(
    user_id: str = Depends(get_current_user_id),
):
    return get_trade_entries(user_id)

