from unittest.mock import patch, MagicMock

from services.alpaca import (
    get_market_clock,
    get_market_indices,
    get_candles,
    submit_market_order,
)


@patch("services.alpaca.trading_client")
def test_get_market_clock(mock_trading_client):
    fake_clock = MagicMock()
    fake_clock.is_open = True

    mock_trading_client.get_clock.return_value = fake_clock

    result = get_market_clock()

    assert result.is_open is True
    mock_trading_client.get_clock.assert_called_once()


@patch("services.alpaca.data_client")
def test_get_market_indices(mock_data_client):
    fake_snapshot = {
        "SPY": {},
        "QQQ": {},
        "DIA": {},
    }

    mock_data_client.get_stock_snapshot.return_value = fake_snapshot

    result = get_market_indices()

    assert result == fake_snapshot
    mock_data_client.get_stock_snapshot.assert_called_once()


@patch("services.alpaca.data_client")
def test_get_candles(mock_data_client):
    fake_df = MagicMock()

    fake_df.reset_index.return_value.to_dict.return_value = [
        {
            "symbol": "AAPL",
            "close": 205.5,
        }
    ]

    fake_bars = MagicMock()
    fake_bars.df = fake_df

    mock_data_client.get_stock_bars.return_value = fake_bars

    result = get_candles("AAPL")

    assert len(result) == 1
    assert result[0]["symbol"] == "AAPL"
    assert result[0]["close"] == 205.5

    mock_data_client.get_stock_bars.assert_called_once()


@patch("services.alpaca.data_client")
def test_get_candles_uppercases_symbol(mock_data_client):
    fake_df = MagicMock()
    fake_df.reset_index.return_value.to_dict.return_value = []

    fake_bars = MagicMock()
    fake_bars.df = fake_df

    mock_data_client.get_stock_bars.return_value = fake_bars

    get_candles("msft")

    request = mock_data_client.get_stock_bars.call_args[0][0]

    assert request.symbol_or_symbols == "MSFT"


@patch("services.alpaca.trading_client")
def test_submit_market_order_buy(mock_trading_client):
    fake_order = MagicMock()

    mock_trading_client.submit_order.return_value = fake_order

    result = submit_market_order(
        "AAPL",
        5,
        "buy",
    )

    assert result == fake_order
    mock_trading_client.submit_order.assert_called_once()


@patch("services.alpaca.trading_client")
def test_submit_market_order_sell(mock_trading_client):
    fake_order = MagicMock()

    mock_trading_client.submit_order.return_value = fake_order

    result = submit_market_order(
        "AAPL",
        2,
        "sell",
    )

    assert result == fake_order
    mock_trading_client.submit_order.assert_called_once()


@patch("services.alpaca.data_client")
def test_get_market_indices_returns_three_indices(mock_data_client):
    fake_snapshot = {
        "SPY": {"price": 600},
        "QQQ": {"price": 550},
        "DIA": {"price": 450},
    }

    mock_data_client.get_stock_snapshot.return_value = fake_snapshot

    result = get_market_indices()

    assert "SPY" in result
    assert "QQQ" in result
    assert "DIA" in result


@patch("services.alpaca.data_client")
def test_get_candles_empty(mock_data_client):
    fake_df = MagicMock()
    fake_df.reset_index.return_value.to_dict.return_value = []

    fake_bars = MagicMock()
    fake_bars.df = fake_df

    mock_data_client.get_stock_bars.return_value = fake_bars

    result = get_candles("AAPL")

    assert result == []