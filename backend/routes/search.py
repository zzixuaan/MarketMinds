from fastapi import APIRouter, HTTPException
from services.finnhub import ( search_symbol, get_company_profile, get_quote )

router = APIRouter()

@router.get("/search/{symbol}")
def search_stock(symbol : str):

    profile = get_company_profile(symbol)
    quote = get_quote(symbol)

    return {
        "symbol": symbol.upper(),
        "profile": profile, 
        "quote": quote
    }

@router.get("/autocomplete/{query}")
def autocomplete(query : str): 
    results = search_symbol(query)

    return [
        { 
            "symbol": stock["symbol"],
            "description": stock["description"]
        } 
        for stock in results.get("result", [])[:10]
    ]