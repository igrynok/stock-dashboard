import asyncio
import functools
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

import finnhub
import websockets as ws_lib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)

# ── In-memory state ───────────────────────────────────────────────
# Latest snapshot per ticker (price, change, history, …)
snapshots: dict[str, dict] = {}
# Accumulated trade history per ticker [{time, price}, …]
histories: dict[str, list] = {}
# Frontend WebSocket clients per ticker
subscribers: dict[str, set[WebSocket]] = {}
# Tickers currently subscribed on Finnhub WS
subscribed_tickers: set[str] = set()
# Live Finnhub WebSocket connection
finnhub_ws_conn = None


# ── Finnhub REST: initial snapshot ───────────────────────────────

def fetch_initial_snapshot(ticker: str) -> dict:
    try:
        quote = finnhub_client.quote(ticker)
        profile = finnhub_client.company_profile2(symbol=ticker)
        return {
            "symbol": ticker,
            "name": profile.get("name", ticker),
            "price": round(float(quote.get("c") or 0), 2),
            "change": round(float(quote.get("d") or 0), 2),
            "changePercent": round(float(quote.get("dp") or 0), 2),
            "high": round(float(quote.get("h") or 0), 2),
            "low": round(float(quote.get("l") or 0), 2),
            "open": round(float(quote.get("o") or 0), 2),
            "prevClose": round(float(quote.get("pc") or 0), 2),
            "exchange": profile.get("exchange", ""),
            "currency": profile.get("currency", "USD"),
            "marketCap": (profile.get("marketCapitalization") or 0) * 1e6,
            "history": [],
            "timestamp": datetime.now().isoformat(),
            "error": None,
        }
    except Exception as e:
        logger.error(f"Error fetching initial data for {ticker}: {e}")
        return {"symbol": ticker, "error": str(e)}


# ── Finnhub WebSocket: trade handler ─────────────────────────────

async def handle_finnhub_message(message: str) -> None:
    msg = json.loads(message)
    if msg.get("type") != "trade":
        return

    for trade in msg.get("data", []):
        ticker = trade["s"]
        if ticker not in snapshots:
            continue

        price = round(float(trade["p"]), 2)
        time_str = datetime.fromtimestamp(trade["t"] / 1000).strftime("%H:%M:%S")

        snapshot = snapshots[ticker]
        prev_close = snapshot.get("prevClose", price)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close * 100) if prev_close else 0, 2)

        snapshot["price"] = price
        snapshot["change"] = change
        snapshot["changePercent"] = change_pct
        snapshot["high"] = max(snapshot.get("high", price), price)
        snapshot["low"] = min(snapshot.get("low", price), price)
        snapshot["timestamp"] = datetime.now().isoformat()

        history = histories.setdefault(ticker, [])
        history.append({"time": time_str, "price": price})
        if len(history) > 500:
            history.pop(0)
        snapshot["history"] = history

        # Broadcast to all frontend clients watching this ticker
        dead: set[WebSocket] = set()
        for client in subscribers.get(ticker, set()):
            try:
                await client.send_text(json.dumps(snapshot))
            except Exception:
                dead.add(client)
        subscribers.get(ticker, set()).difference_update(dead)


# ── Finnhub WebSocket: persistent connection loop ─────────────────

async def finnhub_ws_loop() -> None:
    global finnhub_ws_conn
    url = f"wss://ws.finnhub.io?token={FINNHUB_API_KEY}"
    while True:
        try:
            async with ws_lib.connect(url) as conn:
                finnhub_ws_conn = conn
                logger.info("Connected to Finnhub WebSocket")
                for ticker in subscribed_tickers:
                    await conn.send(json.dumps({"type": "subscribe", "symbol": ticker}))
                async for message in conn:
                    await handle_finnhub_message(message)
        except Exception as e:
            logger.error(f"Finnhub WS disconnected: {e}. Reconnecting in 5s...")
            finnhub_ws_conn = None
        await asyncio.sleep(5)


# ── App lifespan ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(finnhub_ws_loop())
    yield

app = FastAPI(title="Stock Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── HTTP endpoints ────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    ticker = ticker.upper()
    return snapshots.get(ticker) or fetch_initial_snapshot(ticker)


# ── Frontend WebSocket endpoint ───────────────────────────────────

@app.websocket("/ws/{ticker}")
async def websocket_endpoint(websocket: WebSocket, ticker: str) -> None:
    await websocket.accept()
    ticker = ticker.upper()
    logger.info(f"Frontend connected for {ticker}")

    # Fetch initial snapshot if we don't have one yet
    if ticker not in snapshots:
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(None, functools.partial(fetch_initial_snapshot, ticker))
        if data.get("error"):
            logger.warning(f"Could not fetch data for {ticker}, closing connection")
            await websocket.close()
            return
        snapshots[ticker] = data
        histories[ticker] = []

    # Subscribe to Finnhub WS for this ticker if not already
    if ticker not in subscribed_tickers:
        subscribed_tickers.add(ticker)
        if finnhub_ws_conn:
            try:
                await finnhub_ws_conn.send(json.dumps({"type": "subscribe", "symbol": ticker}))
                logger.info(f"Subscribed to Finnhub WS for {ticker}")
            except Exception as e:
                logger.warning(f"Could not subscribe to {ticker} on Finnhub WS: {e}")

    # Register this frontend client and send current snapshot immediately
    subscribers.setdefault(ticker, set()).add(websocket)
    await websocket.send_text(json.dumps(snapshots[ticker]))

    try:
        # Hold the connection open; Finnhub WS loop handles all updates
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"Frontend disconnected for {ticker}")
    finally:
        subscribers.get(ticker, set()).discard(websocket)
