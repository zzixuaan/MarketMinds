from fastapi import APIRouter, Header, HTTPException
from config.firebase_admin import db, verify_token

from services.finnhub import get_quote

router = APIRouter()

@router.get("/portfolio")
def get_portfolio(authorization : str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    try:
        decoded = verify_token(token)
        uid = decoded["uid"]
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        cash = user_data.get("cash", 0)

        holdings_docs = (
            user_ref
            .collection("holdings")
            .stream()
        )

        holdings = []
        total_cost_basis = 0
        total_market_value = 0

        for doc in holdings_docs:

            holding = doc.to_dict()

            symbol = holding["symbol"]
            quantity = holding.get("quantity", 0)
            average_cost = holding.get("averageCost", 0)

            quote = get_quote(symbol)
            current_price = quote.get("c", 0)

            if current_price is None or current_price <= 0:
                current_price = average_cost

            market_value = quantity*current_price
            cost_basis = quantity*average_cost

            unrealised_pnl = market_value - cost_basis
            pnl_percent = ((unrealised_pnl / cost_basis) * 100
                if cost_basis > 0
                else 0
            )

            total_cost_basis += cost_basis
            total_market_value += market_value

            holdings.append({
                "symbol": symbol,
                "quantity": quantity,
                "averageCost": round(average_cost, 2),
                "currentPrice": round(current_price, 2),
                "marketValue": round(market_value, 2),
                "costBasis": round(cost_basis, 2),
                "unrealisedPnl": round(unrealised_pnl, 2),
                "pnlPercent": round(pnl_percent, 2),
                "weight": 0
            })

        for holding in holdings:
            holding["weight"] = (
                round(holding["marketValue"]/total_market_value*100, 2) 
                if total_market_value > 0
                else 0
            )
            
        if holdings: 
            best_holding = max(holdings, key=lambda h: h["pnlPercent"])
            worst_holding = min(holdings, key=lambda h: h["pnlPercent"])
        else: 
            best_holding = None 
            worst_holding = None 


        portfolio_value = cash + total_market_value
        cash_weight = (
            round(cash/portfolio_value*100, 2)
            if portfolio_value > 0
            else 0
        )
        unrealised_pnl = (total_market_value - total_cost_basis)
        unrealised_pnl_percent = (
            (unrealised_pnl/total_cost_basis) * 100
            if total_cost_basis > 0
            else 0
        )

        return {
            "cash": round(cash, 2),
            "portfolioValue": round(portfolio_value, 2),
            "marketValue": round(total_market_value, 2),
            "unrealisedPnl": round(unrealised_pnl, 2),
            "unrealisedPnlPercent": round(unrealised_pnl_percent, 2),
            "holdings": holdings,
            "numberOfHoldings": len(holdings),
            "totalCostBasis": round(total_cost_basis, 2),
            "bestHolding": best_holding,
            "worstHolding": worst_holding,
            "cashWeight": cash_weight
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    

@router.get("/portfolio/history")
def get_portfolio_history(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    try: 
        decoded = verify_token(token)
        uid = decoded["uid"]

        user_ref = db.collection("users").document(uid)

        history_docs = (
            user_ref
            .collection("portfolio_history")
            .order_by("timestamp")
            .stream()
        )

        history = []

        for doc in history_docs:
            data = doc.to_dict()
            history.append({"value": round(data.get("value", 0), 2), "timestamp": data["timestamp"]})

        return history
    
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
     
