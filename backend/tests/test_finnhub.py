from unittest.mock import patch, MagicMock

from services.finnhub import (
    search_symbol,
    get_company_profile,
    get_quote,
    get_market_status,
    get_market_news,
)


@patch("services.finnhub.requests.get")
def test_search_symbol(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "count": 1,
        "result": [
            {
                "symbol": "AAPL",
                "description": "Apple Inc.",
            }
        ],
    }

    mock_get.return_value = mock_response

    result = search_symbol("apple")

    assert result["count"] == 1
    assert result["result"][0]["symbol"] == "AAPL"


@patch("services.finnhub.requests.get")
def test_get_company_profile(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "finnhubIndustry": "Technology",
    }

    mock_get.return_value = mock_response

    result = get_company_profile("aapl")

    assert result["ticker"] == "AAPL"
    assert result["name"] == "Apple Inc."
    assert result["finnhubIndustry"] == "Technology"


@patch("services.finnhub.requests.get")
def test_get_quote(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "c": 210.50,
        "h": 215.00,
        "l": 208.30,
    }

    mock_get.return_value = mock_response

    result = get_quote("AAPL")

    assert result["c"] == 210.50
    assert result["h"] == 215.00
    assert result["l"] == 208.30


@patch("services.finnhub.requests.get")
def test_get_market_status(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "exchange": "US",
        "isOpen": True,
    }

    mock_get.return_value = mock_response

    result = get_market_status("us")

    assert result["exchange"] == "US"
    assert result["isOpen"] is True


@patch("services.finnhub.requests.get")
def test_get_market_news(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {
            "headline": "Stocks Rally",
            "summary": "Markets closed higher.",
            "source": "Reuters",
            "image": "image.jpg",
            "url": "https://example.com/news",
            "datetime": 1723000000,
        }
    ]

    mock_get.return_value = mock_response

    result = get_market_news()

    assert len(result) == 1
    assert result[0]["headline"] == "Stocks Rally"
    assert result[0]["source"] == "Reuters"
    assert result[0]["url"] == "https://example.com/news"


@patch("services.finnhub.requests.get")
def test_search_symbol_empty_result(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "count": 0,
        "result": [],
    }

    mock_get.return_value = mock_response

    result = search_symbol("invalid")

    assert result["count"] == 0
    assert result["result"] == []


@patch("services.finnhub.requests.get")
def test_get_quote_empty_response(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = {}

    mock_get.return_value = mock_response

    result = get_quote("UNKNOWN")

    assert result == {}


@patch("services.finnhub.requests.get")
def test_market_news_empty(mock_get):
    mock_response = MagicMock()
    mock_response.json.return_value = []

    mock_get.return_value = mock_response

    result = get_market_news()

    assert result == []