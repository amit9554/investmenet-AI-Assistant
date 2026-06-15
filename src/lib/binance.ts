import { prisma } from "./db";
import { MONITORED_SYMBOLS } from "./signalEngine";

const BINANCE_API_URL = process.env.BINANCE_API_URL || "https://api.binance.com";
export const INDIAN_SYMBOLS = ["NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

interface BinanceTickerPrice {
  symbol: string;
  price: string;
}

export async function fetchLivePrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // 1. Fetch Crypto Prices from Binance
  try {
    const res = await fetch(`${BINANCE_API_URL}/api/v3/ticker/price`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data: BinanceTickerPrice[] = await res.json();
      for (const item of data) {
        if (MONITORED_SYMBOLS.includes(item.symbol)) {
          prices[item.symbol] = parseFloat(item.price);
        }
      }
    }
  } catch (error) {
    console.warn("Binance price API failed, using fallback crypto mocks:", error);
  }

  // Populate crypto fallbacks if missing
  for (const sym of MONITORED_SYMBOLS) {
    if (!prices[sym]) {
      prices[sym] = getFallbackBasePrice(sym);
    }
  }

  // 2. Add Indian Stock Prices (fluctuating mock values)
  for (const sym of INDIAN_SYMBOLS) {
    const base = getFallbackBasePrice(sym);
    prices[sym] = Number((base + (Math.random() - 0.5) * (base * 0.005)).toFixed(2));
  }

  return prices;
}

export async function syncHistoricalCandles(symbol: string, timeframe: string = "1h", limit: number = 100): Promise<void> {
  const upperSymbol = symbol.toUpperCase();

  // If Indian Stock, generate mock stock market candles
  if (INDIAN_SYMBOLS.includes(upperSymbol)) {
    await syncIndianStockCandles(upperSymbol, timeframe, limit);
    return;
  }

  // Standard Binance Crypto Sync
  const binanceInterval = mapTimeframeToBinance(timeframe);
  try {
    const res = await fetch(
      `${BINANCE_API_URL}/api/v3/klines?symbol=${upperSymbol}&interval=${binanceInterval}&limit=${limit}`
    );
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);

    const rawKlines: any[][] = await res.json();
    const candleData = rawKlines.map((kline) => ({
      symbol: upperSymbol,
      timeframe,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      timestamp: new Date(kline[0]),
    }));

    for (const candle of candleData) {
      await prisma.marketCandle.upsert({
        where: {
          symbol_timeframe_timestamp: {
            symbol: candle.symbol,
            timeframe: candle.timeframe,
            timestamp: candle.timestamp,
          },
        },
        update: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        },
        create: candle,
      });
    }

    console.log(`Synced ${candleData.length} crypto candles for ${upperSymbol} (${timeframe}).`);
  } catch (err) {
    console.error(`Failed to sync Binance candles for ${upperSymbol} (${timeframe}):`, err);
    await createMockRecentCandle(upperSymbol, timeframe);
  }
}

async function syncIndianStockCandles(symbol: string, timeframe: string, limit: number): Promise<void> {
  const basePrice = getFallbackBasePrice(symbol);
  let currentPrice = basePrice;

  const intervalMs =
    timeframe === "1d"
      ? 24 * 60 * 60 * 1000
      : timeframe === "4h"
      ? 4 * 60 * 60 * 1000
      : timeframe === "1h"
      ? 60 * 60 * 1000
      : 15 * 60 * 1000;

  const candleData = [];
  const nowMs = Date.now();

  for (let i = limit; i >= 0; i--) {
    const timestamp = new Date(nowMs - i * intervalMs);
    
    // Indian stocks are closed on weekends. For the simulation, we keep prices drifting.
    const volatility = timeframe === "1d" ? 0.018 : timeframe === "1h" ? 0.005 : 0.002;
    const changePercent = (Math.random() - 0.49) * volatility; // slight upward drift
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.3));
    const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.3));
    const volume = (basePrice * 100) * (0.4 + Math.random() * 1.6);

    candleData.push({
      symbol,
      timeframe,
      open,
      high,
      low,
      close,
      volume,
      timestamp,
    });

    currentPrice = close;
  }

  // Batch upsert to database
  try {
    for (const candle of candleData) {
      await prisma.marketCandle.upsert({
        where: {
          symbol_timeframe_timestamp: {
            symbol: candle.symbol,
            timeframe: candle.timeframe,
            timestamp: candle.timestamp,
          },
        },
        update: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        },
        create: candle,
      });
    }
    console.log(`Simulated and saved ${candleData.length} Indian Stock candles for ${symbol} (${timeframe}).`);
  } catch (err) {
    console.error(`Failed to save Indian Stock candles for ${symbol}:`, err);
  }
}

function mapTimeframeToBinance(tf: string): string {
  switch (tf) {
    case "5m": return "5m";
    case "15m": return "15m";
    case "1h": return "1h";
    case "4h": return "4h";
    case "1d": return "1d";
    default: return "1h";
  }
}

function getFallbackBasePrice(symbol: string): number {
  switch (symbol) {
    // Cryptos
    case "BTCUSDT": return 68500;
    case "ETHUSDT": return 3500;
    case "SOLUSDT": return 160;
    case "BNBUSDT": return 590;
    case "XRPUSDT": return 0.65;
    // Indian Stocks & Indices
    case "NIFTY": return 23520;
    case "SENSEX": return 77250;
    case "RELIANCE": return 2950;
    case "TCS": return 3820;
    case "INFY": return 1530;
    default: return 1.0;
  }
}

async function createMockRecentCandle(symbol: string, timeframe: string): Promise<void> {
  const base = getFallbackBasePrice(symbol);
  const drift = (Math.random() - 0.49) * (base * 0.005);
  const open = base;
  const close = base + drift;
  const high = Math.max(open, close) * 1.002;
  const low = Math.min(open, close) * 0.998;
  const volume = base * 20;

  try {
    await prisma.marketCandle.upsert({
      where: {
        symbol_timeframe_timestamp: {
          symbol,
          timeframe,
          timestamp: new Date(),
        },
      },
      update: {},
      create: {
        symbol,
        timeframe,
        open,
        high,
        low,
        close,
        volume,
        timestamp: new Date(),
      },
    });
  } catch (_) {}
}
