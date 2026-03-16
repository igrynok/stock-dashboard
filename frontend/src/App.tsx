import { TrendingUp, Wifi } from "lucide-react";
import { StockCard } from "./components/StockCard";

const DISPLAY_TICKERS = ["AAPL"];

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