import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onAddTicker: (ticker: string) => void;
}

export function SearchBar({ onAddTicker }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from refreshing the page
    
    const cleanTicker = inputValue.trim().toUpperCase();
    if (cleanTicker) {
      onAddTicker(cleanTicker);
      setInputValue(""); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-8 flex w-full max-w-[400px] gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter stock ticker (e.g. TSLA, NVDA)"
        className="flex-1 rounded-lg border border-brand-border bg-brand-panel px-4 py-3 font-mono text-sm text-brand-text outline-none transition-colors focus:border-brand-green"
      />
      <button 
        type="submit"
        className="flex items-center justify-center rounded-lg bg-brand-green px-5 text-brand-dark transition-opacity hover:opacity-80"
      >
        <Search size={18} />
      </button>
    </form>
  );
}