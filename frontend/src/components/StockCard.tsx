import { useStockWebSocket } from "../hooks/useStockWebSocket";
import { formatMarketCap } from "../utils/format";
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

// Hex values kept only for recharts SVG props that don't accept CSS classes
const CHART_GREEN = "#c8f0a0";
const CHART_RED = "#f07070";
const CHART_MUTED = "#444";
const CHART_AXIS = "#1a1a2e";
const CHART_REF_LINE = "#2a2a40";

interface TooltipPayload {
  value: number;
  payload: { time: string };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-brand-border bg-brand-dark px-3.5 py-2 font-mono text-xs text-brand-text">
        <div className="text-[#888]">{payload[0]?.payload?.time}</div>
        <div className="font-bold text-brand-green">${payload[0]?.value?.toFixed(2)}</div>
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
      <div className="rounded-xl border border-brand-border bg-brand-panel p-6 text-center font-mono text-xs text-[#444]">
        {status === "connecting" ? "LOADING..." : "OFFLINE"}
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const accentColor = isPositive ? CHART_GREEN : CHART_RED;
  const accentClass = isPositive ? "text-brand-green" : "text-brand-red";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-brand-panel p-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 font-mono text-xs tracking-widest text-[#555]">
            {data.exchange}
          </div>
          <h3 className="m-0 text-lg font-bold text-brand-text">
            {data.symbol}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold leading-none text-brand-text">
            ${data.price.toFixed(2)}
          </div>
          <div className={`mt-1 flex items-center justify-end gap-1 font-mono text-[13px] font-semibold ${accentClass}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isPositive ? "+" : ""}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history} margin={{ top: 5, right: 0, left: -35, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: CHART_MUTED }}
              axisLine={{ stroke: CHART_AXIS }}
              tickLine={false}
              interval={Math.floor(data.history.length / 3)}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fill: CHART_MUTED }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={data.prevClose} stroke={CHART_REF_LINE} strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        {[
          { label: "OPEN", value: data.open },
          { label: "HIGH", value: data.high },
          { label: "PREV CLOSE", value: data.prevClose },
          { label: "LOW", value: data.low },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="mb-0.5 font-mono text-[#555]">{label}</div>
            <div className="font-semibold text-brand-text">${value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Market Cap & Last Updated */}
      <div className="flex items-center justify-between border-t border-brand-border pt-3">
        <div>
          <div className="mb-1 font-mono text-[10px] text-[#555]">MARKET CAP</div>
          <div className="text-[13px] font-semibold text-brand-text">{formatMarketCap(data.marketCap)}</div>
        </div>
        <div className="text-right">
          <div className="mb-1 font-mono text-[10px] text-[#555]">LAST UPDATE</div>
          <div className="flex items-center justify-end gap-1.5 font-mono text-[11px]">
            {status === "connected" ? (
              <>
                <Wifi size={12} className="text-brand-green" />
                <span className="text-brand-green">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}
                </span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-brand-red" />
                <span className="text-brand-red">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
