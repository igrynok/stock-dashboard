import { useState, useEffect, useRef, useCallback } from "react";
import { StockData } from "../types";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseStockWebSocketReturn {
  data: StockData | null;
  status: ConnectionStatus;
  lastUpdated: Date | null;
  reconnect: () => void;
}

export function useStockWebSocket(ticker: string): UseStockWebSocketReturn {
  const [data, setData] = useState<StockData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    if (!ticker || !isMountedRef.current) return;

    if (isMountedRef.current) {
      setStatus("connecting");
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/${ticker}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) {
          setStatus("connected");
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const parsed: StockData = JSON.parse(event.data);
          if (parsed.error) {
            setStatus("error");
          } else {
            setData(parsed);
            setLastUpdated(new Date());
            setStatus("connected");
          }
        } catch {
          setStatus("error");
        }
      };

      ws.onerror = () => {
        if (isMountedRef.current) {
          setStatus("error");
        }
      };

      ws.onclose = () => {
        if (isMountedRef.current) {
          setStatus("disconnected");
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
    } catch {
      if (isMountedRef.current) {
        setStatus("error");
      }
    }
  }, [ticker]); // Recreate the function only if the ticker changes

  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    connectWebSocket();
  }, [connectWebSocket]);

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connectWebSocket]); 

  return { data, status, lastUpdated, reconnect };
}