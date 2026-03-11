import { useStockWebSocket } from "./hooks/useStockWebSocket";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";

const DISPLAY_TICKERS = ["AAPL"];

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#0a0a0f",
        border: "1px solid #1e1e2e",
        padding: "8px 14px",
        fontFamily: "'Space Mono', monospace",
        fontSize: "12px",
        color: "#e2e2f0",
      }}>
        <div style={{ color: "#888" }}>{payload[0]?.payload?.time}</div>
        <div style={{ color: "#c8f0a0", fontWeight: 700 }}>${payload[0]?.value?.toFixed(2)}</div>
      </div>
    );
  }
  return null;
};

interface StockCardProps {
  ticker: string;
}

function StockCard({ ticker }: StockCardProps) {
  const { data, status, lastUpdated } = useStockWebSocket(ticker);

  if (!data || status !== "connected") {
    return (
      <div style={{
        background: "#0a0a14",
        border: "1px solid #1a1a28",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        color: "#444",
        fontFamily: "'Space Mono', monospace",
        fontSize: "12px",
      }}>
        {status === "connecting" ? "LOADING..." : "OFFLINE"}
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const priceColor = isPositive ? "#c8f0a0" : "#f07070";
  const chartColor = isPositive ? "#c8f0a0" : "#f07070";
  const minPrice = Math.min(...data.history.map(h => h.price));
  const maxPrice = Math.max(...data.history.map(h => h.price));

  return (
    <div style={{
      background: "#0a0a14",
      border: "1px solid #1a1a28",
      borderRadius: "12px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <div style={{
            fontSize: "12px",
            fontFamily: "'Space Mono', monospace",
            color: "#555",
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}>
            {data.exchange}
          </div>
          <h3 style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            color: "#e2e2f0",
          }}>
            {data.symbol}
          </h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#e2e2f0",
            lineHeight: 1,
          }}>
            ${data.price.toFixed(2)}
          </div>
          <div style={{
            fontSize: "13px",
            fontWeight: 600,
            color: priceColor,
            fontFamily: "'Space Mono', monospace",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "flex-end",
            marginTop: "4px",
          }}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isPositive ? "+" : ""}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: "120px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history} margin={{ top: 5, right: 0, left: -35, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#444" }}
              axisLine={{ stroke: "#1a1a2e" }}
              tickLine={false}
              interval={Math.floor(data.history.length / 3)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: "#444" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={data.prevClose}
              stroke="#2a2a40"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        fontSize: "11px",
      }}>
        <div>
          <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: "2px" }}>
            OPEN
          </div>
          <div style={{ fontWeight: 600, color: "#e2e2f0" }}>
            ${data.open.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: "2px" }}>
            HIGH
          </div>
          <div style={{ fontWeight: 600, color: "#e2e2f0" }}>
            ${data.high.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: "2px" }}>
            PREV CLOSE
          </div>
          <div style={{ fontWeight: 600, color: "#e2e2f0" }}>
            ${data.prevClose.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: "2px" }}>
            LOW
          </div>
          <div style={{ fontWeight: 600, color: "#e2e2f0" }}>
            ${data.low.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Market Cap */}
      <div style={{
        paddingTop: "12px",
        borderTop: "1px solid #1a1a28",
      }}>
        <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "10px", marginBottom: "4px" }}>
          MARKET CAP
        </div>
        <div style={{ fontWeight: 600, color: "#e2e2f0", fontSize: "13px" }}>
          {formatMarketCap(data.marketCap)}
        </div>
      </div>

      {/* Last Updated */}
      <div style={{
        paddingTop: "12px",
        borderTop: "1px solid #1a1a28",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "10px" }}>
          LAST UPDATE
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontFamily: "'Space Mono', monospace",
        }}>
          {status === "connected" ? (
            <>
              <Wifi size={12} style={{ color: "#c8f0a0" }} />
              <span style={{ color: "#c8f0a0" }}>
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={12} style={{ color: "#f07070" }} />
              <span style={{ color: "#f07070" }}>OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#070710",
      color: "#e2e2f0",
      fontFamily: "'Syne', sans-serif",
      padding: "0",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1a1a2e",
        padding: "0 32px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#08080f",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "linear-gradient(135deg, #c8f0a0, #60d080)",
            borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp size={16} color="#070710" />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em", color: "#fff" }}>
            MARKET<span style={{ color: "#c8f0a0" }}>PULSE</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Space Mono', monospace", fontSize: "11px" }}>
          <Wifi size={13} color="#c8f0a0" />
          <span style={{ color: "#c8f0a0" }}>LIVE</span>
        </div>
      </header>

      {/* Stock Cards Grid */}
      <main style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        padding: "32px 32px",
        maxWidth: "1600px",
        margin: "0 auto",
      }}>
        {DISPLAY_TICKERS.map((ticker) => (
          <StockCard key={ticker} ticker={ticker} />
        ))}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070710; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a14; }
        ::-webkit-scrollbar-thumb { background: #2a2a40; border-radius: 3px; }
      `}</style>
    </div>
  );
}
