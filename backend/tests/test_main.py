import json
from unittest.mock import MagicMock, patch

import pytest

import main


# ── fetch_initial_snapshot ────────────────────────────────────────

MOCK_QUOTE = {
    "c": 251.73,   # current price
    "d": 3.74,     # change
    "dp": 1.51,    # change percent
    "h": 254.60,
    "l": 249.93,
    "o": 249.93,
    "pc": 247.99,  # previous close
}

MOCK_PROFILE = {
    "name": "Apple Inc",
    "exchange": "NASDAQ NMS - GLOBAL MARKET",
    "currency": "USD",
    "marketCapitalization": 3640000,  # in thousands → *1e6 = 3.64T
}


@pytest.fixture(autouse=True)
def reset_state():
    """Reset shared in-memory state between tests."""
    main.snapshots.clear()
    main.histories.clear()
    main.subscribers.clear()
    main.subscribed_tickers.clear()
    yield


def test_fetch_initial_snapshot_shape():
    with patch.object(main.finnhub_client, "quote", return_value=MOCK_QUOTE), \
         patch.object(main.finnhub_client, "company_profile2", return_value=MOCK_PROFILE):

        result = main.fetch_initial_snapshot("AAPL")

    assert result["symbol"] == "AAPL"
    assert result["name"] == "Apple Inc"
    assert result["price"] == 251.73
    assert result["change"] == 3.74
    assert result["changePercent"] == 1.51
    assert result["high"] == 254.60
    assert result["low"] == 249.93
    assert result["open"] == 249.93
    assert result["prevClose"] == 247.99
    assert result["exchange"] == "NASDAQ NMS - GLOBAL MARKET"
    assert result["currency"] == "USD"
    assert result["marketCap"] == 3640000 * 1e6
    assert result["history"] == []
    assert result["error"] is None


def test_fetch_initial_snapshot_handles_none_values():
    """Quote fields returning None should default to 0, not raise."""
    empty_quote = {k: None for k in MOCK_QUOTE}
    with patch.object(main.finnhub_client, "quote", return_value=empty_quote), \
         patch.object(main.finnhub_client, "company_profile2", return_value={}):

        result = main.fetch_initial_snapshot("AAPL")

    assert result["price"] == 0.0
    assert result["error"] is None


def test_fetch_initial_snapshot_returns_error_on_exception():
    with patch.object(main.finnhub_client, "quote", side_effect=Exception("timeout")):
        result = main.fetch_initial_snapshot("AAPL")

    assert result["error"] == "timeout"


# ── handle_finnhub_message ────────────────────────────────────────

def make_trade_message(ticker: str, price: float, timestamp_ms: int = 1700000000000) -> str:
    return json.dumps({
        "type": "trade",
        "data": [{"s": ticker, "p": price, "t": timestamp_ms, "v": 100}],
    })


@pytest.mark.asyncio
async def test_handle_trade_updates_price_and_change():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}

    await main.handle_finnhub_message(make_trade_message("AAPL", 251.73))

    snap = main.snapshots["AAPL"]
    assert snap["price"] == 251.73
    assert snap["change"] == round(251.73 - 247.99, 2)
    assert snap["changePercent"] == round((251.73 - 247.99) / 247.99 * 100, 2)


@pytest.mark.asyncio
async def test_handle_trade_updates_high():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}

    await main.handle_finnhub_message(make_trade_message("AAPL", 260.0))

    assert main.snapshots["AAPL"]["high"] == 260.0


@pytest.mark.asyncio
async def test_handle_trade_updates_low():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}

    await main.handle_finnhub_message(make_trade_message("AAPL", 240.0))

    assert main.snapshots["AAPL"]["low"] == 240.0


@pytest.mark.asyncio
async def test_handle_trade_appends_history():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}
    main.histories["AAPL"] = []

    await main.handle_finnhub_message(make_trade_message("AAPL", 251.73))

    assert len(main.histories["AAPL"]) == 1
    assert main.histories["AAPL"][0]["price"] == 251.73


@pytest.mark.asyncio
async def test_handle_trade_caps_history_at_500():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}
    main.histories["AAPL"] = [{"time": "09:00", "price": 250.0}] * 500

    await main.handle_finnhub_message(make_trade_message("AAPL", 251.0))

    assert len(main.histories["AAPL"]) == 500


@pytest.mark.asyncio
async def test_handle_trade_ignores_unknown_ticker():
    """Should not raise if trade arrives for a ticker not in snapshots."""
    await main.handle_finnhub_message(make_trade_message("UNKNOWN", 100.0))
    assert "UNKNOWN" not in main.snapshots


@pytest.mark.asyncio
async def test_handle_non_trade_message_is_ignored():
    main.snapshots["AAPL"] = {"prevClose": 247.99, "high": 250.0, "low": 248.0, "timestamp": ""}
    ping = json.dumps({"type": "ping"})

    await main.handle_finnhub_message(ping)

    assert "price" not in main.snapshots["AAPL"]
