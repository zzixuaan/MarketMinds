from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


@patch("routes.market.get_market_clock")
def test_market_status(mock_clock):

    fake_clock = MagicMock()
    fake_clock.is_open = True
    fake_clock.next_open = "2026-08-07 09:30:00"
    fake_clock.next_close = "2026-08-06 16:00:00"

    mock_clock.return_value = fake_clock

    response = client.get("/api/market-status")

    assert response.status_code == 200

    data = response.json()

    assert data["is_open"] is True
    assert data["next_open"] == "2026-08-07 09:30:00"
    assert data["next_close"] == "2026-08-06 16:00:00"


@patch("routes.market.get_market_indices")
def test_market_indices(mock_indices):

    def snapshot(price, previous):
        trade = MagicMock()
        trade.price = price

        bar = MagicMock()
        bar.close = previous

        stock = MagicMock()
        stock.latest_trade = trade
        stock.previous_daily_bar = bar

        return stock

    mock_indices.return_value = {
        "SPY": snapshot(600, 590),
        "QQQ": snapshot(500, 490),
        "DIA": snapshot(400, 395),
    }

    response = client.get("/api/market-indices")

    assert response.status_code == 200

    data = response.json()

    assert "SPY" in data
    assert "QQQ" in data
    assert "DIA" in data

    assert data["SPY"]["price"] == 600
    assert round(data["SPY"]["change_percent"], 2) == 1.69


@patch("routes.market.get_market_news")
def test_market_news(mock_news):

    mock_news.return_value = [
        {
            "headline": "Stocks Rally",
            "summary": "Markets gained today.",
            "source": "Reuters",
            "image": "image.jpg",
            "url": "https://example.com",
            "datetime": 1720000000,
        }
    ]

    response = client.get("/api/market-news")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["headline"] == "Stocks Rally"
    assert data[0]["source"] == "Reuters"


@patch("routes.market.get_market_news")
def test_market_news_empty(mock_news):

    mock_news.return_value = []

    response = client.get("/api/market-news")

    assert response.status_code == 200
    assert response.json() == []