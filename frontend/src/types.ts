export interface HistoryPoint {
  time: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  marketCap: number;
  peRatio: number;
  week52High: number;
  week52Low: number;
  exchange: string;
  currency: string;
  history: HistoryPoint[];
  timestamp: string;
  error: string | null;
}
