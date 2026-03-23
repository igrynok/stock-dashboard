export interface HistoryPoint {
  time: string;
  price: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap: number;
  exchange: string;
  currency: string;
  history: HistoryPoint[];
  timestamp: string;
  error: string | null;
}
