from fastapi import APIRouter, Header, HTTPException
from config.firebase_admin import db, verify_token
from firebase_admin import firestore

from services.finnhub import get_quote, get_company_profile

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
        sector_totals = {}

        for doc in holdings_docs:

            holding = doc.to_dict()

            symbol = holding["symbol"]
            quantity = holding.get("quantity", 0)
            average_cost = holding.get("averageCost", 0)

            sector = holding.get("sector")
            if not sector: 
                profile = get_company_profile(symbol)
                sector = profile.get("finnhubIndustry", "Unknown")
                doc.reference.update({"sector": sector})

            quote = get_quote(symbol)
            current_price = quote.get("c", 0)

            if current_price is None or current_price <= 0:
                current_price = average_cost

            market_value = quantity*current_price
            sector_totals[sector] = (sector_totals.get(sector, 0) + market_value)
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

        sector_allocation = []
        for sector, value in sector_totals.items():
            sector_allocation.append({
                "sector": sector,
                "value": round(value, 2),
                "percentage": round(
                    value / portfolio_value * 100,
                    1
                ) if portfolio_value > 0 else 0
            })
        sector_allocation.sort(
            key=lambda x: x["value"],
            reverse=True
        )

        starting_capital = user_data.get("startingCapital", 0)

        total_return = portfolio_value - starting_capital

        total_return_percent = (
            (total_return / starting_capital) * 100
            if starting_capital > 0
            else 0
        )

        history_docs = (
            user_ref
            .collection("portfolio_history")
            .order_by(
                "timestamp",
                direction = firestore.Query.DESCENDING
            )
            .limit(2)
            .stream()
        )

        history_values = []

        for doc in history_docs:
            data = doc.to_dict()
            history_values.append(
                data.get("value", 0)
            )

        if len(history_values) >= 2:
            daily_change = history_values[0] - history_values[1]
            daily_change_percent = (
                (daily_change / history_values[1]) * 100
                if history_values[1] > 0
                else 0
            )
        else:
            daily_change = 0
            daily_change_percent = 0

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

        roi = unrealised_pnl_percent

        largest_position = (
            max(holdings, key=lambda h: h["weight"])
            if holdings
            else None
        )

        average_position = (
            total_market_value / len(holdings)
            if holdings
            else 0
        )

        hhi = sum((holding["weight"] / 100) ** 2 for holding in holdings)
        diversification_score = round((1 - hhi) * 100, 1)
        diversification_score = max(0, min(diversification_score, 100))

        if diversification_score >= 80:
            risk_level = "Low"
        elif diversification_score >= 60:
            risk_level = "Medium"
        else:
            risk_level = "High"
        if cash_weight >= 50 and risk_level != "Low":
            risk_level = "Medium"

        holdings.sort(
             key=lambda h: h["marketValue"],
            reverse=True
        )

        return {
            "cash": round(cash, 2),
            "portfolioValue": round(portfolio_value, 2),
            "startingCapital": round(starting_capital, 2),
            "totalReturn": round(total_return, 2),
            "totalReturnPercent": round(total_return_percent, 2),
            "dailyChange": round(daily_change, 2),
            "dailyChangePercent": round(daily_change_percent, 2),
            "marketValue": round(total_market_value, 2),
            "unrealisedPnl": round(unrealised_pnl, 2),
            "unrealisedPnlPercent": round(unrealised_pnl_percent, 2),
            "holdings": holdings,
            "numberOfHoldings": len(holdings),
            "totalCostBasis": round(total_cost_basis, 2),
            "bestHolding": best_holding,
            "worstHolding": worst_holding,
            "cashWeight": cash_weight,
            "roi": round(roi, 2),
            "largestPosition": largest_position,
            "averagePosition": round(average_position, 2),
            "diversificationScore": diversification_score,
            "riskLevel": risk_level,
            "sectorAllocation": sector_allocation,
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
     
