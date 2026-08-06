from fastapi.testclient import TestClient

from main import app
from auth import get_current_user_id
import routes.journal_routes as journal_routes

client = TestClient(app)

def setup_function():
    app.dependency_overrides[get_current_user_id] = (lambda: "test-user-id")

def teardown_function():
    app.dependency_overrides.clear()

def test_create_open_entry_allows_null_exit_and_pnl(monkeypatch,):
    def fake_create_journal_entry(
        user_id: str,
        entry_data: dict,
    ):
        return { 
            "id": "journal1",
            **entry_data,
        }

    monkeypatch.setattr(
        journal_routes,
        "create_journal_entry",
        fake_create_journal_entry,
    )

    payload = {
        "title": "Testing",
        "ticker": "TEST",
        "tradeStatus": "Open",
        "direction": "Buy",
        "entryPrice": 100,
        "quantity": 10,
        "positionSize": 1000,
        "timePeriod": "1 Month",
        "stopLoss": 95,
        "takeProfit": 110,
        "riskToReward": 2,
        "thesis": "Testing",
        "catalyst": "Testing",
        "confidence": 5,
        "emotions": "Neutral",
        "exitPrice": None,
        "pnl": None,
        "executionErrors": "",
        "lessonsLearnt": "",


    }

    response = client.post("/api/journal", json=payload,)

    assert response.status_code == 201

    data = response.json()

    assert data["id"] == "journal1"
    assert data["tradeStatus"] == "Open"
    assert data["exitPrice"] is None
    assert data["pnl"] is None

def test_create_entry_rejects_missing_ticker():
    payload = {
        "title": "Testing",
        "tradeStatus": "Open",
        "direction": "Buy",
        "entryPrice": 100,
        "quantity": 10,
        "positionSize": 1000,
        "timePeriod": "1 Month",
        "stopLoss": 95,
        "takeProfit": 110,
        "riskToReward": 2,
        "thesis": "Testing",
        "catalyst": "Testing",
        "confidence": 5,
        "emotions": "Neutral",
        "exitPrice": None,
        "pnl": None,
        "executionErrors": "",
        "lessonsLearnt": "",
    }

    response = client.post(
        "/api/journal",
        json=payload,
    )

    assert response.status_code == 422

def test_create_entry_rejects_missing_stoploss():
    payload = {
        "title": "Testing",
        "ticker": "TEST",
        "tradeStatus": "Open",
        "direction": "Buy",
        "entryPrice": 100,
        "quantity": 10,
        "positionSize": 1000,
        "timePeriod": "1 Month",
        "takeProfit": 110,
        "thesis": "Testing",
        "catalyst": "Testing",
        "confidence": 5,
        "emotions": "Neutral",
        "exitPrice": None,
        "pnl": None,
        "executionErrors": "",
        "lessonsLearnt": "",
    }

    response = client.post(
        "/api/journal",
        json=payload,
    )

    assert response.status_code == 422

    

    







