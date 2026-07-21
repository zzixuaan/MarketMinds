from fastapi import APIRouter, Header, HTTPException, Depends
from config.firebase_admin import db, verify_token
from firebase_admin import firestore
from auth import get_current_user_id
import statistics

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
            .stream()
        )

        history_values = []

        for doc in history_docs:
            data = doc.to_dict()
            history_values.append(
                data.get("value", 0)
            )

        history_values_chrono = list(reversed(history_values))

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

        daily_returns = []
        for i in range(1, len(history_values_chrono)):
            previous = history_values_chrono[i-1]
            current = history_values_chrono[i]

            if previous > 0:
                daily_return = ((current - previous) / previous)
                daily_returns.append(daily_return)

        if len(daily_returns) > 1:
            average_return = statistics.mean(daily_returns)

            daily_volatility = statistics.stdev(daily_returns)
            volatility = daily_volatility * (252 ** 0.5)

            sharpe_ratio = (
                (average_return / daily_volatility)
                * (252 ** 0.5)
                if daily_volatility != 0
                else 0
            )

        else:
            volatility = 0
            sharpe_ratio = 0

        negative_returns = [
            r for r in daily_returns
            if r < 0
        ]

        if len(negative_returns) > 1:
            downside_deviation = statistics.stdev(
                negative_returns
            )

            sortino_ratio = (
                average_return /
                downside_deviation *
                (252 ** 0.5)
                if downside_deviation != 0
                else 0
            )

        else:
            sortino_ratio = 0

        peak = history_values_chrono[0] if history_values_chrono else 0
        max_drawdown = 0

        for value in history_values_chrono:
            if value > peak:
                peak = value

            if peak > 0:
                drawdown = ((value - peak) / peak)
                max_drawdown = min(
                    max_drawdown,
                    drawdown
                )

        max_drawdown_percent = (max_drawdown * 100)

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

        # Return score (0-100)
        return_score = 50
        if roi > 0:
            return_score += min(roi * 2, 50)
        return_score = max(0, min(return_score, 100))

        #risk score
        risk_score = 50

        # sharpe
        if sharpe_ratio >= 2:
            risk_score += 25
        elif sharpe_ratio >= 1:
            risk_score += 15
        elif sharpe_ratio < 0:
            risk_score -= 15
        
        # drawdown penalty
        if max_drawdown_percent > -5:
            risk_score += 20
        elif max_drawdown_percent > -15:
            risk_score += 10
        else:
            risk_score -= 20

        # volaility penalty
        if volatility < 0.15:
            risk_score += 5
        elif volatility > 0.30:
            risk_score -= 10
        risk_score = max(0, min(risk_score, 100))

        # Diversification
        diversification_score_component = diversification_score

        # Consistency 
        consistency_score = 50

        if sortino_ratio >= 1:
            consistency_score += 30
        elif sortino_ratio < 0:
            consistency_score -= 20

        consistency_score = max(
            0,
            min(consistency_score,100)
        )

        # Final portfolio score
        portfolio_score = (
            return_score * 0.30 +
            risk_score * 0.30 +
            diversification_score_component * 0.20 +
            consistency_score * 0.20
        )

        portfolio_score = round(portfolio_score)

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
            "sharpeRatio": round(sharpe_ratio,2),
            "sortinoRatio": round(sortino_ratio,2),
            "maxDrawdown": round(max_drawdown_percent,2),
            "volatility": round(volatility*100, 2),
            "portfolioScore": portfolio_score,
            "scoreBreakdown": {
                "performance": round(return_score),
                "riskManagement": round(risk_score),
                "diversification": round(diversification_score_component),
                "consistency": round(consistency_score)
            },
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
    

@router.get("/holdings/top")
def get_top_holdings(
    user_id: str = Depends(get_current_user_id),
):
    try:
        documents = (
            db.collection("users")
                .document(user_id)
                .collection("holdings")
                .stream()
        )

        holding = [] #list

        for document in documents:
            holdings = document.to_dict()

            symbol = holdings.get("symbol", document.id)
            quantity = holdings.get("quantity", 0)
            averageCost = holdings.get("averageCost", 0)

            quote = get_quote(symbol)
            current_price = quote.get("c") or averageCost

            market_value = quantity * current_price

            holding.append({
                "id": document.id,
                "symbol": symbol,
                "quantity": quantity,
                "averageCost": averageCost,
                "currentPrice": current_price,
                "marketValue": round(market_value, 2),
            })

        holding.sort(
            key=lambda holding: holding["marketValue"],
            reverse=True,
        )

        return holding[:3]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
    

@router.get("/portfolio/team")
def get_portfolio_for_others(uid: str):

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


     
