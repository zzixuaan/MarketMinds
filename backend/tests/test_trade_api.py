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



@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_successful_new_buy(mock_db, mock_get_quote):

    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 105}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 1000,
    }

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    # No existing holding
    holding_doc = MagicMock()
    holding_doc.exists = False

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    holding_collection = MagicMock()
    holding_collection.document.return_value = holding_ref

    trade_ref = MagicMock()

    trade_collection = MagicMock()
    trade_collection.document.return_value = trade_ref

    def get_collection(name):
        if name == "holdings":
            return holding_collection
        if name == "trades":
            return trade_collection
        return MagicMock()

    user_ref.collection.side_effect = get_collection

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 5,
            "price": 100,
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    user_ref.update.assert_called_with({
        "cash": 500
    })

    holding_ref.set.assert_called_once()

    clear_overrides()


@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_buy_existing_holding_updates_average_cost(
    mock_db,
    mock_get_quote,
):

    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 120}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 2000,
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 10,
        "averageCost": 100,
    }

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
            "side": "buy",
            "quantity": 10,
            "price": 120,
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    user_ref.update.assert_called_with({
        "cash": 800
    })

    holding_ref.set.assert_any_call({
        "symbol": "AAPL",
        "quantity": 20,
        "averageCost": 110.0,
    })

    clear_overrides()

@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_partial_sell(mock_db, mock_get_quote):

    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 120}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500,
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 10,
        "averageCost": 100,
    }

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
            "quantity": 4,
            "price": 120,
        },
    )

    assert response.status_code == 200

    # 500 + (4 * 120) = 980
    user_ref.update.assert_called_with({
        "cash": 980
    })

    holding_ref.update.assert_called_with({
        "quantity": 6
    })

    clear_overrides()


@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_complete_sell_deletes_holding(mock_db, mock_get_quote):

    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 120}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500,
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 5,
        "averageCost": 100,
    }

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
            "quantity": 5,
            "price": 120,
        },
    )

    assert response.status_code == 200

    user_ref.update.assert_called_with({
        "cash": 1100
    })

    holding_ref.delete.assert_called_once()

    clear_overrides()


@patch("routes.trade.db")
def test_sell_more_shares_than_owned(mock_db):

    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500,
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 5,
        "averageCost": 100,
    }

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
            "quantity": 10,
            "price": 100,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Not enough shares."

    clear_overrides()



@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_successful_sell_partial_holding(mock_db, mock_get_quote):
    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 110}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 10,
        "averageCost": 100
    }

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    trades_ref = MagicMock()
    trade_document = MagicMock()
    trades_ref.document.return_value = trade_document

    history_ref = MagicMock()

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    def collection_side_effect(name):
        if name == "holdings":
            return MagicMock(
                document=MagicMock(return_value=holding_ref)
            )
        if name == "trades":
            return trades_ref
        if name == "portfolio_history":
            return history_ref

    user_ref.collection.side_effect = collection_side_effect

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "sell",
            "quantity": 4,
            "price": 110
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    user_ref.update.assert_called_with({
        "cash": 940
    })

    holding_ref.update.assert_called_with({
        "quantity": 6
    })

    clear_overrides()



@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_successful_sell_all_shares(mock_db, mock_get_quote):
    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 110}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 5,
        "averageCost": 100
    }

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    trades_ref = MagicMock()
    history_ref = MagicMock()

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    def collection_side_effect(name):
        if name == "holdings":
            return MagicMock(
                document=MagicMock(return_value=holding_ref)
            )
        if name == "trades":
            return trades_ref
        if name == "portfolio_history":
            return history_ref

    user_ref.collection.side_effect = collection_side_effect

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "sell",
            "quantity": 5,
            "price": 110
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    user_ref.update.assert_called_with({
        "cash": 1050
    })

    holding_ref.delete.assert_called_once()

    clear_overrides()


@patch("routes.trade.db")
def test_sell_more_shares_than_owned(mock_db):
    app.dependency_overrides[get_current_user_id] = override_user

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 500
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 5,
        "averageCost": 100
    }

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
            "quantity": 10,
            "price": 100
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Not enough shares."

    clear_overrides()


@patch("routes.trade.get_quote")
@patch("routes.trade.db")
def test_buy_existing_holding_updates_average_cost(
    mock_db,
    mock_get_quote,
):
    app.dependency_overrides[get_current_user_id] = override_user

    mock_get_quote.return_value = {"c": 120}

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "cash": 2000
    }

    holding_doc = MagicMock()
    holding_doc.exists = True
    holding_doc.to_dict.return_value = {
        "symbol": "AAPL",
        "quantity": 10,
        "averageCost": 100
    }

    holding_ref = MagicMock()
    holding_ref.get.return_value = holding_doc

    trades_ref = MagicMock()
    history_ref = MagicMock()

    user_ref = MagicMock()
    user_ref.get.return_value = user_doc

    def collection_side_effect(name):
        if name == "holdings":
            return MagicMock(
                document=MagicMock(return_value=holding_ref)
            )
        if name == "trades":
            return trades_ref
        if name == "portfolio_history":
            return history_ref

    user_ref.collection.side_effect = collection_side_effect

    mock_db.collection.return_value.document.return_value = user_ref

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 10,
            "price": 120
        },
    )

    assert response.status_code == 200

    # (10*100 + 10*120) / 20 = 110
    holding_ref.set.assert_any_call({
        "symbol": "AAPL",
        "quantity": 20,
        "averageCost": 110.0
    })

    user_ref.update.assert_called_with({
        "cash": 800
    })

    clear_overrides()


def test_trade_invalid_quantity_type():
    app.dependency_overrides[get_current_user_id] = override_user

    response = client.post(
        "/api/trade",
        json={
            "symbol": "AAPL",
            "side": "buy",
            "quantity": "abc",
            "price": 100
        },
    )

    assert response.status_code == 422

    clear_overrides()