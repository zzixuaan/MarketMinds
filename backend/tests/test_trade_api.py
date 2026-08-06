from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from auth import get_current_user_id
from main import app

client = TestClient(app)


def override_user():
    return "user123"


def clear_overrides():
    app.dependency_overrides.clear()


def test_place_trade_missing_token():
    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 1,
            "price": 100,
        },
    )

    assert response.status_code == 401


@patch("routes.trade.db")
def test_place_trade_user_not_found(mock_db):

    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = False

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 1,
            "price": 100,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

    clear_overrides()


@patch("routes.trade.db")
def test_buy_insufficient_cash(mock_db):

    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 50,
    }

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 10,
            "price": 100,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Insufficient cash."

    clear_overrides()


@patch("routes.trade.db")
def test_sell_stock_not_owned(mock_db):

    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 1000,
    }

    holding_doc = MagicMock()
    holding_doc.exists = False

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc
    user_ref.collection.return_value.document.return_value = holding_ref

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "sell",
            "quantity": 1,
            "price": 100,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "You do not own this stock."

    clear_overrides()


@patch("routes.trade.db")
def test_invalid_trade_side(mock_db):

    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 1000,
    }

    holding_doc = MagicMock()

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc
    user_ref.collection.return_value.document.return_value = holding_ref

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "invalid",
            "quantity": 1,
            "price": 100,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid trade side."

    clear_overrides()


def test_list_entries_missing_token():

    response = client.get("/api/trade")

    assert response.status_code == 401