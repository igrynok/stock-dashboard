import asyncio
import functools
import json
import logging
import os
from datetime import datetime

import finnhub
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
client = finnhub.Client(api_key=FINNHUB_API_KEY)


def fetch_intraday_history(ticker: str) -> list:
    """Fetch intraday chart data from Yahoo Finance chart API (no auth needed)."""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        params = {"interval": "5m", "range": "1d"}
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, params=params, headers=headers, timeout=10)
        data = r.json()

        result = data["chart"]["result"][0]
        timestamps = result["timestamp"]
        closes = result["indicators"]["quote"][0]["close"]

        history = []
        for t, c in zip(timestamps, closes):
            if c is not None:
                history.append({
                    "time": datetime.fromtimestamp(t).strftime("%H:%M"),
                    "price": round(float(c), 2),
                })
        return history
    except Exception as e:
        logger.warning(f"Chart history fetch failed for {ticker}: {e}")
        return []


def fetch_stock_data(ticker: str) -> dict:
    try:
        quote = client.quote(ticker)
        profile = client.company_profile2(symbol=ticker)
        history = fetch_intraday_history(ticker)

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
            "history": history,
            "timestamp": datetime.now().isoformat(),
            "error": None,
        }
    except Exception as e:
        logger.error(f"Error fetching {ticker}: {e}")
        return {"symbol": ticker.upper(), "error": str(e)}


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/stock/{ticker}")
def get_stock(ticker: str):
    return fetch_stock_data(ticker.upper())


@app.websocket("/ws/{ticker}")
async def websocket_endpoint(websocket: WebSocket, ticker: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for {ticker}")
    ticker = ticker.upper()
    try:
        loop = asyncio.get_event_loop()

        # Send initial data immediately
        data = await loop.run_in_executor(None, functools.partial(fetch_stock_data, ticker))
        if data and not data.get("error"):
            await websocket.send_text(json.dumps(data))
            logger.info(f"Sent initial data for {ticker}")
        else:
            logger.warning(f"Failed to fetch initial data for {ticker}: {data}")

        # Then send updates every 10 seconds
        while True:
            await asyncio.sleep(10)
            try:
                data = await loop.run_in_executor(None, functools.partial(fetch_stock_data, ticker))
            except Exception as fetch_error:
                logger.error(f"Error fetching {ticker}: {fetch_error}", exc_info=False)
                continue
            if data and not data.get("error"):
                await websocket.send_text(json.dumps(data))
                logger.info(f"Sent update for {ticker}")
            else:
                logger.warning(f"No valid data for {ticker}: {data}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {ticker}")
    except Exception as e:
        logger.error(f"WebSocket error for {ticker}: {e}", exc_info=False)
        try:
            await websocket.close()
        except Exception:
            pass