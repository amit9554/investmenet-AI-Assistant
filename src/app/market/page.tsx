"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useStore } from "@/hooks/use-store";
import TradingViewWidget from "@/components/tradingview-widget";
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateVWAP,
  detectSupportResistance,
  detectBreakoutsAndReversals,
  Candle,
} from "@/lib/ta";
import {
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

import { INDIAN_SYMBOLS } from "../dashboard/page";

export default function MarketPage() {
  const { prices } = useStore();
  const [marketType, setMarketType] = useState<"crypto" | "indian">("crypto");
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [candles, setCandles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<any>(null);

  // Set default asset when market type changes
  useEffect(() => {
    if (marketType === "crypto") {
      setSelectedSymbol("BTCUSDT");
    } else {
      setSelectedSymbol("NIFTY");
    }
  }, [marketType]);

  const fetchCandleData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/${selectedSymbol}?timeframe=${timeframe}&limit=250`);
      if (res.ok) {
        const data = await res.json();
        setCandles(data.candles || []);
      }
    } catch (err) {
      console.error("Error fetching candle history:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  // Compute indicators client-side
  useEffect(() => {
    if (candles.length < 50) {
      setIndicators(null);
      return;
    }

    const taCandles: Candle[] = candles.map((c) => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      timestamp: new Date(c.timestamp),
    }));

    const closes = taCandles.map((c) => c.close);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const atr = calculateATR(taCandles, 14);
    const vwap = calculateVWAP(taCandles);

    const zones = detectSupportResistance(taCandles);
    const pattern = detectBreakoutsAndReversals(taCandles, zones);

    setIndicators({
      rsi: rsi[rsi.length - 1],
      ema20: ema20[ema20.length - 1],
      ema50: ema50[ema50.length - 1],
      ema200: ema200[ema200.length - 1],
      macd: macd.macdLine[macd.macdLine.length - 1],
      macdSignal: macd.signalLine[macd.signalLine.length - 1],
      atr: atr[atr.length - 1],
      vwap: vwap[vwap.length - 1],
      supportZones: zones.filter((z) => z.type === "SUPPORT").slice(0, 2),
      resistanceZones: zones.filter((z) => z.type === "RESISTANCE").slice(0, 2),
      pattern,
    });
  }, [candles]);

  const mapTimeframeLabel = (tf: string) => {
    switch (tf) {
      case "5m": return "5 Minutes";
      case "15m": return "15 Minutes";
      case "1h": return "1 Hour";
      case "4h": return "4 Hours";
      case "1d": return "Daily";
      default: return "1 Hour";
    }
  };

  const getRsiLabel = (rsiVal: number) => {
    if (rsiVal >= 70) return { text: "Overbought", color: "text-red-400" };
    if (rsiVal <= 30) return { text: "Oversold", color: "text-emerald-400" };
    return { text: "Neutral", color: "text-gray-400" };
  };

  // Maps local symbol name to TradingView Full Symbol syntax
  const getTVFormattedSymbol = (sym: string) => {
    const s = sym.toUpperCase();
    if (s === "NIFTY") return "NSE:NIFTY";
    if (s === "SENSEX") return "BSE:SENSEX";
    if (INDIAN_SYMBOLS.includes(s)) return `NSE:${s}`;
    return `BINANCE:${s}`;
  };

  const cryptoSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
  const indianSymbols = ["NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];
  const activeSymbols = marketType === "crypto" ? cryptoSymbols : indianSymbols;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Selectors */}
      <div className="flex flex-col justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-card-foreground sm:text-3xl font-outfit">
            Live Market Screen
          </h1>
          <p className="text-sm text-muted">
            Current asset: <span className="font-bold text-indigo-500">{selectedSymbol}</span> - Interval:{" "}
            {mapTimeframeLabel(timeframe)}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-2 bg-card border border-border rounded-xl p-1.5 self-start">
          {["5m", "15m", "1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                timeframe === tf ? "bg-indigo-600 text-white" : "text-muted hover:text-card-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Market Category Selector */}
      <div className="flex items-center space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setMarketType("crypto")}
          className={`px-4 py-2 text-sm font-extrabold transition-all border-b-2 ${
            marketType === "crypto"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted hover:text-card-foreground"
          }`}
        >
          Crypto Markets
        </button>
        <button
          onClick={() => setMarketType("indian")}
          className={`px-4 py-2 text-sm font-extrabold transition-all border-b-2 ${
            marketType === "indian"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted hover:text-card-foreground"
          }`}
        >
          Indian Equities & Indices
        </button>
      </div>

      {/* Asset selectors */}
      <div className="flex flex-wrap gap-2.5">
        {activeSymbols.map((symbol) => (
          <button
            key={symbol}
            onClick={() => setSelectedSymbol(symbol)}
            className={`flex items-center space-x-2.5 rounded-xl border px-5 py-3 transition ${
              selectedSymbol === symbol
                ? "border-indigo-600 bg-indigo-600/10 text-white glow-indigo"
                : "border-border bg-card text-muted hover:border-border/80 hover:text-card-foreground"
            }`}
          >
            <span className="text-sm font-bold">{symbol}</span>
            <span className="text-xs font-semibold">
              {marketType === "indian" ? "₹" : "$"}
              {(prices[symbol] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* TradingView interactive widget */}
        <div className="lg:col-span-3">
          <TradingViewWidget symbol={getTVFormattedSymbol(selectedSymbol)} />
        </div>

        {/* Technical Analysis Indicator Sidebar */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Technical Indicators</span>
            <SlidersHorizontal className="h-4.5 w-4.5 text-indigo-400" />
          </div>

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="text-xs text-muted font-semibold">Syncing indicators...</span>
            </div>
          ) : !indicators ? (
            <div className="text-center text-xs text-gray-500 py-12">Insufficient historical data to calculate.</div>
          ) : (
            <div className="space-y-4 text-xs font-medium">
              {/* Pattern Scan */}
              <div className="rounded-xl bg-input p-3 border border-border space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 mb-0.5">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">Pattern Detector</span>
                </div>
                <div className="font-bold text-card-foreground">
                  {indicators.pattern.type === "NONE" ? "Standard Trend" : indicators.pattern.type}
                </div>
                <div className="text-[10px] text-muted leading-relaxed">{indicators.pattern.description}</div>
              </div>

              {/* RSI */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted">RSI (14)</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${getRsiLabel(indicators.rsi).color}`}>
                    {getRsiLabel(indicators.rsi).text}
                  </span>
                  <span className="text-card-foreground font-bold">
                    {indicators.rsi !== undefined ? Math.round(indicators.rsi) : "N/A"}
                  </span>
                </div>
              </div>

              {/* MACD */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted">MACD Hist</span>
                <span
                  className={`font-bold ${
                    indicators.macd !== undefined && indicators.macdSignal !== undefined
                      ? indicators.macd >= indicators.macdSignal
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {indicators.macd !== undefined && indicators.macdSignal !== undefined
                    ? indicators.macd >= indicators.macdSignal
                      ? "Bullish"
                      : "Bearish"
                    : "N/A"}
                </span>
              </div>

              {/* EMAs */}
              <div className="space-y-1.5 border-b border-border/40 pb-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">EMA 20</span>
                  <span className="text-card-foreground font-bold">
                    {marketType === "indian" ? "₹" : "$"}
                    {indicators.ema20 !== undefined ? indicators.ema20.toFixed(2) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">EMA 50</span>
                  <span className="text-card-foreground font-bold">
                    {marketType === "indian" ? "₹" : "$"}
                    {indicators.ema50 !== undefined ? indicators.ema50.toFixed(2) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">EMA 200</span>
                  <span className="text-card-foreground font-bold">
                    {marketType === "indian" ? "₹" : "$"}
                    {indicators.ema200 !== undefined ? indicators.ema200.toFixed(2) : "N/A"}
                  </span>
                </div>
              </div>

              {/* ATR & VWAP */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted">ATR (Volatility)</span>
                <span className="text-card-foreground font-bold">
                  {marketType === "indian" ? "₹" : "$"}
                  {indicators.atr !== undefined ? indicators.atr.toFixed(2) : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted">VWAP</span>
                <span className="text-card-foreground font-bold">
                  {marketType === "indian" ? "₹" : "$"}
                  {indicators.vwap !== undefined ? indicators.vwap.toFixed(2) : "N/A"}
                </span>
              </div>

              {/* Support & Resistance zones */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Zones Detected</div>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                  <div className="rounded bg-emerald-500/5 border border-emerald-500/10 p-2">
                    <div className="text-emerald-500 mb-0.5 uppercase tracking-wide">Supports</div>
                    {indicators.supportZones.map((z: any, i: number) => (
                      <div key={i} className="text-card-foreground">
                        {marketType === "indian" ? "₹" : "$"}{z.price.toFixed(1)}
                      </div>
                    ))}
                  </div>
                  <div className="rounded bg-red-500/5 border border-red-500/10 p-2">
                    <div className="text-red-500 mb-0.5 uppercase tracking-wide">Resistances</div>
                    {indicators.resistanceZones.map((z: any, i: number) => (
                      <div key={i} className="text-card-foreground">
                        {marketType === "indian" ? "₹" : "$"}{z.price.toFixed(1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
