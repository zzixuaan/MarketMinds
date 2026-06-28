from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from typing import Any
from services.finnhub import get_quote
from auth import get_current_user_id
from config.firebase_admin import db

router = APIRouter()


class TradeRequest(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: float


@router.post("/trade")
def place_trade(
    trade: TradeRequest,
    user_id: str = Depends(get_current_user_id),
):

    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_doc.to_dict()
        cash = user_data.get("cash", 0)

        trade_value = trade.quantity * trade.price


        holding_ref = user_ref.collection("holdings").document(
            trade.symbol.upper()
        )
        holding_doc = holding_ref.get()

        if trade.side.lower() == "buy":
            if cash < trade_value:
                raise HTTPException(
                    status_code=400,
                    detail="Insufficient cash."
                )
            new_cash = cash - trade_value

            if holding_doc.exists:
                holding = holding_doc.to_dict()
                
                old_quantity = holding["quantity"]
                old_average = holding["averageCost"]

                new_quantity = old_quantity + trade.quantity
                new_average = (
                    old_quantity * old_average
                    + trade.quantity * trade.price
                ) / new_quantity

            else:
                new_quantity = trade.quantity
                new_average = trade.price

            user_ref.update({
                "cash": new_cash
            })

            holding_ref.set({
                "symbol": trade.symbol.upper(),
                "quantity": new_quantity,
                "averageCost": new_average,
            })

        elif trade.side.lower() == "sell":

            if not holding_doc.exists:
                raise HTTPException(
                    status_code=400,
                    detail="You do not own this stock."
                )
            
            holding = holding_doc.to_dict()
            old_quantity = holding["quantity"]

            if trade.quantity > old_quantity:
                raise HTTPException(
                    status_code=400,
                    detail="Not enough shares."
                )

            remaining = old_quantity - trade.quantity
            new_cash = cash + trade_value
            user_ref.update({
                "cash": new_cash
            })

            if remaining == 0:
                holding_ref.delete()
            else:
                holding_ref.update({
                    "quantity": remaining
                })
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid trade side."
            )
    
        trade_data = {
            "symbol": trade.symbol.upper(),
            "side": trade.side,
            "quantity": trade.quantity,
            "price": trade.price,
            "total": trade.quantity * trade.price,
            "created_at": firestore.SERVER_TIMESTAMP,
        }

        user_ref.collection("trades").add(trade_data)

        total_market_value = 0

        holdings_docs = user_ref.collection("holdings").stream()

        for doc in holdings_docs:
            holding = doc.to_dict()
            symbol = holding["symbol"]
            quantity = holding["quantity"]

            quote = get_quote(symbol)
            current_price = quote.get("c", holding["averageCost"])

            if current_price is None or current_price <= 0:
                current_price = holding["averageCost"]

            total_market_value += quantity * current_price

        portfolio_value = new_cash + total_market_value

        user_ref.collection("portfolio_history").add({
            "timestamp": firestore.SERVER_TIMESTAMP,
            "value": round(portfolio_value, 2),
        })

        return {"success": True}

    except HTTPException:
        raise

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