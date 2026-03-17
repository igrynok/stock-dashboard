import { useState } from "react";
import { TrendingUp, Wifi } from "lucide-react";
import { StockCard } from "./components/StockCard";

export default function App() {
  const [tickers, setTickers] = useState<string[]>(["AAPL"]);

  const handleAddTicker = (newTicker: string) => {
    if (!tickers.includes(newTicker)) {
      setTickers((prev) => [...prev, newTicker]); 
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-green selection:text-black">
      
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-brand-border bg-[#08080f] px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-green to-brand-greenDark shadow-sm">
            <TrendingUp size={16} className="text-brand-dark" />
          </div>
          <span className="text-base font-bold tracking-widest text-white">
            MARKET<span className="text-brand-green">PULSE</span>
          </span>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-brand-green">
          <Wifi size={13} className="animate-pulse" />
          <span>LIVE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] p-8">

        {/* Stock Cards Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {tickers.map((ticker) => (
            <StockCard key={ticker} ticker={ticker} />
          ))}
        </div>
      </main>
    </div>
  );
}