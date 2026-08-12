from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import MagicMock

from main import app
import routes.portfolio as portfolio

client = TestClient(app)


def test_get_portfolio_missing_token():
    response = client.get("/api/portfolio")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing token"


def test_get_portfolio_history_missing_token():
    response = client.get("/api/portfolio/history")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing token"


def test_get_portfolio_invalid_token(monkeypatch):

    def fake_verify_token(token):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        fake_verify_token,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer badtoken"
        },
    )

    assert response.status_code == 401


def test_get_portfolio_history_invalid_token(monkeypatch):

    def fake_verify_token(token):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        fake_verify_token,
    )

    response = client.get(
        "/api/portfolio/history",
        headers={
            "Authorization": "Bearer badtoken"
        },
    )

    assert response.status_code == 401


def test_get_portfolio_user_not_found(monkeypatch):

    monkeypatch.setattr(
        portfolio,
        "verify_token",
        lambda token: {"uid": "test-user"},
    )

    fake_doc = MagicMock()
    fake_doc.exists = False

    fake_user = MagicMock()
    fake_user.get.return_value = fake_doc

    fake_db = MagicMock()
    fake_db.collection.return_value.document.return_value = fake_user

    monkeypatch.setattr(
        portfolio,
        "db",
        fake_db,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer validtoken"
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"



def test_get_portfolio_multiple_holdings(monkeypatch):
    monkeypatch.setattr(
        portfolio,
        "verify_token",
        lambda token: {"uid": "test-user"},
    )

    fake_user_doc = MagicMock()
    fake_user_doc.exists = True
    fake_user_doc.to_dict.return_value = {
        "cash": 1000,
        "startingCapital": 5000,
    }

    holding_1 = MagicMock()
    holding_1.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 10,
        "averageCost": 100,
        "sector": "Technology",
    }

    holding_2 = MagicMock()
    holding_2.to_dict.return_value = {
        "symbol": "MSFT",
        "quantity": 5,
        "averageCost": 200,
        "sector": "Technology",
    }

    fake_holdings = [holding_1, holding_2]

    history_doc = MagicMock()
    history_doc.to_dict.return_value = {
        "value": 3000,
    }

    fake_history = [history_doc]

    fake_holdings_ref = MagicMock()
    fake_holdings_ref.stream.return_value = fake_holdings

    fake_history_ref = MagicMock()
    fake_history_ref.order_by.return_value.stream.return_value = fake_history

    fake_user_ref = MagicMock()
    fake_user_ref.get.return_value = fake_user_doc
    fake_user_ref.collection.side_effect = (
        lambda name: (
            fake_holdings_ref
            if name == "holdings"
            else fake_history_ref
        )
    )

    fake_db = MagicMock()
    fake_db.collection.return_value.document.return_value = fake_user_ref

    monkeypatch.setattr(
        portfolio,
        "db",
        fake_db,
    )

    # Mock stock prices
    def fake_get_quote(symbol):
        prices = {
            "AAPL": {"c": 120},
            "MSFT": {"c": 220},
        }
        return prices[symbol]

    monkeypatch.setattr(
        portfolio,
        "get_quote",
        fake_get_quote,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer validtoken"
        },
    )

    assert response.status_code == 200

    data = response.json()

    # AAPL: 10 × 120 = 1200
    # MSFT: 5 × 220 = 1100
    # Total market value = 2300
    assert data["marketValue"] == 2300

    # 1000 cash + 2300 stocks
    assert data["portfolioValue"] == 3300

    assert data["numberOfHoldings"] == 2

    assert data["holdings"][0]["symbol"] == "AAPL"
    assert data["holdings"][0]["marketValue"] == 1200

    assert data["holdings"][1]["symbol"] == "MSFT"
    assert data["holdings"][1]["marketValue"] == 1100


def test_get_portfolio_empty_holdings(monkeypatch):
    monkeypatch.setattr(
        portfolio,
        "verify_token",
        lambda token: {"uid": "test-user"},
    )

    fake_user_doc = MagicMock()
    fake_user_doc.exists = True
    fake_user_doc.to_dict.return_value = {
        "cash": 5000,
        "startingCapital": 5000,
    }

    fake_holdings_ref = MagicMock()
    fake_holdings_ref.stream.return_value = []

    fake_history_ref = MagicMock()
    fake_history_ref.order_by.return_value.stream.return_value = []

    fake_user_ref = MagicMock()
    fake_user_ref.get.return_value = fake_user_doc
    fake_user_ref.collection.side_effect = (
        lambda name: (
            fake_holdings_ref
            if name == "holdings"
            else fake_history_ref
        )
    )

    fake_db = MagicMock()
    fake_db.collection.return_value.document.return_value = fake_user_ref

    monkeypatch.setattr(
        portfolio,
        "db",
        fake_db,
    )

    response = client.get(
        "/api/portfolio",
        headers={
            "Authorization": "Bearer validtoken"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["cash"] == 5000
    assert data["marketValue"] == 0
    assert data["portfolioValue"] == 5000
    assert data["numberOfHoldings"] == 0
    assert data["totalCostBasis"] == 0
    assert data["unrealisedPnl"] == 0
    assert data["bestHolding"] is None
    assert data["worstHolding"] is None
    assert data["largestPosition"] is None
    assert data["averagePosition"] == 0