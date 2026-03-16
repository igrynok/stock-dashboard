import { useStockWebSocket } from "../hooks/useStockWebSocket";
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

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

interface TooltipPayload {
  value: number;
  payload: {
    time: string;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
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

export interface StockCardProps {
  ticker: string;
}

export function StockCard({ ticker }: StockCardProps) {
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

      {/* Market Cap & Last Updated */}
      <div style={{
        paddingTop: "12px",
        borderTop: "1px solid #1a1a28",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
           <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "10px", marginBottom: "4px" }}>
            MARKET CAP
          </div>
          <div style={{ fontWeight: 600, color: "#e2e2f0", fontSize: "13px" }}>
            {formatMarketCap(data.marketCap)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
            <div style={{ color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "10px", marginBottom: "4px" }}>
              LAST UPDATE
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontFamily: "'Space Mono', monospace",
              justifyContent: "flex-end"
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
    </div>
  );
}