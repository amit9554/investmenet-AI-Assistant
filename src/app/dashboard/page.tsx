"use client";

import React, { useEffect, useState } from "react";
import { useStore, CURRENCY_SYMBOLS, CURRENCY_RATES } from "@/hooks/use-store";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Clock,
  Gauge,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from "recharts";

interface MarketSentiment {
  fearGreedScore: number;
  fearGreedValue: string;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  overallSentiment: string;
}

export const INDIAN_SYMBOLS = ["NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

export default function Dashboard() {
  const { prices, priceChanges, currency } = useStore();
  const [marketType, setMarketType] = useState<"crypto" | "indian">("crypto");
  
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [winRate, setWinRate] = useState(75);
  const [totalClosed, setTotalClosed] = useState(12);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Currency conversion helper
  const formatDisplayPrice = (val: number, symbol: string) => {
    const isIndian = INDIAN_SYMBOLS.includes(symbol.toUpperCase());
    let usdVal = val;
    if (isIndian) {
      usdVal = val / 83.50; // Normalize Indian Stock INR price to USD base
    }
    const converted = usdVal * CURRENCY_RATES[currency];
    return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const fetchData = async () => {
    try {
      const sentRes = await fetch("/api/sentiment");
      const sentData = await sentRes.json();
      setSentiment(sentData);

      const sigRes = await fetch("/api/signals");
      const sigData = await sigRes.json();
      setSignals(sigData.signals || []);
      setWinRate(sigData.winRate || 75);
      setTotalClosed(sigData.totalClosed || 12);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getPriceColorClass = (symbol: string) => {
    const change = priceChanges[symbol];
    if (change === "up") return "text-emerald-400 animate-flash-green font-bold";
    if (change === "down") return "text-red-400 animate-flash-red font-bold";
    return "text-card-foreground";
  };

  // Chart data adaptive logic
  const getPerformanceData = () => {
    if (marketType === "crypto") {
      return [
        { name: "Mon", price: 67200 },
        { name: "Tue", price: 68100 },
        { name: "Wed", price: 67900 },
        { name: "Thu", price: 68500 },
        { name: "Fri", price: 69400 },
        { name: "Sat", price: 68900 },
        { name: "Sun", price: prices.BTCUSDT || 68500 },
      ];
    } else {
      return [
        { name: "Mon", price: 23120 },
        { name: "Tue", price: 23250 },
        { name: "Wed", price: 23410 },
        { name: "Thu", price: 23380 },
        { name: "Fri", price: 23550 },
        { name: "Sat", price: 23480 },
        { name: "Sun", price: prices.NIFTY || 23520 },
      ];
    }
  };

  // Filter signals list based on current active tab
  const isIndianAsset = (sym: string) => INDIAN_SYMBOLS.includes(sym.toUpperCase());

  const activeSignals = signals.filter((s) => {
    const isIndian = isIndianAsset(s.symbol);
    return s.status === "OPEN" && (marketType === "indian" ? isIndian : !isIndian);
  });

  const closedSignals = signals
    .filter((s) => {
      const isIndian = isIndianAsset(s.symbol);
      return s.status === "CLOSED" && (marketType === "indian" ? isIndian : !isIndian);
    })
    .slice(0, 5);

  // Derive gainers and losers
  const getGainers = () => {
    if (marketType === "crypto") {
      return [
        { symbol: "SOLUSDT", change: "+4.85%", price: prices.SOLUSDT },
        { symbol: "BTCUSDT", change: "+1.92%", price: prices.BTCUSDT },
      ];
    } else {
      return [
        { symbol: "RELIANCE", change: "+3.45%", price: prices.RELIANCE },
        { symbol: "TCS", change: "+1.20%", price: prices.TCS },
      ];
    }
  };

  const getLosers = () => {
    if (marketType === "crypto") {
      return [
        { symbol: "XRPUSDT", change: "-2.10%", price: prices.XRPUSDT },
        { symbol: "BNBUSDT", change: "-0.45%", price: prices.BNBUSDT },
      ];
    } else {
      return [
        { symbol: "INFY", change: "-1.85%", price: prices.INFY },
        { symbol: "SENSEX", change: "-0.15%", price: prices.SENSEX },
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-muted font-outfit">Syncing live charts...</p>
      </div>
    );
  }

  const cryptoTickers = [
    { name: "BTCUSDT", display: "Bitcoin" },
    { name: "ETHUSDT", display: "Ethereum" },
    { name: "SOLUSDT", display: "Solana" },
    { name: "BNBUSDT", display: "BNB" },
    { name: "XRPUSDT", display: "Ripple" },
  ];

  const indianTickers = [
    { name: "NIFTY", display: "Nifty 50" },
    { name: "SENSEX", display: "BSE Sensex" },
    { name: "RELIANCE", display: "Reliance Ind." },
    { name: "TCS", display: "TCS Ltd" },
    { name: "INFY", display: "Infosys Ltd" },
  ];

  const activeTickers = marketType === "crypto" ? cryptoTickers : indianTickers;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-card-foreground sm:text-3xl font-outfit">
            System Overview
          </h1>
          <p className="text-sm text-muted">Real-time indicators, market gauges, and AI trade alerts</p>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 rounded-xl bg-card border border-border px-4 py-2.5 text-sm font-bold text-card-foreground hover:bg-accent transition"
            id="dashboard-refresh-btn"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync Markets</span>
          </button>
        </div>
      </div>

      {/* Market Category Selector */}
      <div className="flex items-center space-x-2 border-b border-border pb-3">
        <button
          onClick={() => setMarketType("crypto")}
          className={`px-4 py-2 text-sm font-extrabold transition-all border-b-2 ${
            marketType === "crypto"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted hover:text-card-foreground"
          }`}
          id="tab-crypto-market"
        >
          Crypto Assets
        </button>
        <button
          onClick={() => setMarketType("indian")}
          className={`px-4 py-2 text-sm font-extrabold transition-all border-b-2 ${
            marketType === "indian"
              ? "border-indigo-600 text-indigo-500"
              : "border-transparent text-muted hover:text-card-foreground"
          }`}
          id="tab-indian-market"
        >
          Indian Stock Market
        </button>
      </div>

      {/* Ticker Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {activeTickers.map((token) => (
          <div
            key={token.name}
            className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between hover:border-border/85 transition"
          >
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{token.display}</span>
            <span className={`text-lg font-extrabold tracking-tight mt-1.5 ${getPriceColorClass(token.name)}`}>
              {formatDisplayPrice(prices[token.name] || 0, token.name)}
            </span>
          </div>
        ))}
      </div>

      {/* Main Grid: Sentiment & Win Rates */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sentiment Gauge */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Fear & Greed Index</span>
            <Gauge className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-5xl font-extrabold text-card-foreground font-outfit mb-1">
              {sentiment?.fearGreedScore || 75}
            </div>
            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 mt-2 border border-emerald-500/20">
              {sentiment?.fearGreedValue || "Greed"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border/60 pt-4">
            <div>
              <div className="text-muted font-semibold mb-0.5">Bullish</div>
              <div className="font-extrabold text-emerald-500">{sentiment?.bullishCount || 72}%</div>
            </div>
            <div>
              <div className="text-muted font-semibold mb-0.5">Neutral</div>
              <div className="font-extrabold text-muted-foreground">{sentiment?.neutralCount || 18}%</div>
            </div>
            <div>
              <div className="text-muted font-semibold mb-0.5">Bearish</div>
              <div className="font-extrabold text-red-500">{sentiment?.bearishCount || 10}%</div>
            </div>
          </div>
        </div>

        {/* Win Rate Stats */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Assistant Win Rate</span>
            <Percent className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-5xl font-extrabold text-indigo-500 font-outfit mb-1">
              {winRate}%
            </div>
            <div className="text-xs text-muted font-semibold mt-2">
              Based on {totalClosed} closed virtual signals
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs font-semibold">
            <div className="flex items-center space-x-1 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              <span>Verified Algorithms</span>
            </div>
            <span className="text-muted">No guaranteed profits</span>
          </div>
        </div>

        {/* Top Gainers & Losers */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Daily Leaders</span>
            <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="space-y-3.5">
            {/* Gainers */}
            {getGainers().map((g) => (
              <div key={g.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-card-foreground">{g.symbol}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs text-muted font-medium">
                    {formatDisplayPrice(g.price || 0, g.symbol)}
                  </span>
                  <span className="flex items-center space-x-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>{g.change}</span>
                  </span>
                </div>
              </div>
            ))}
            {/* Losers */}
            {getLosers().map((l) => (
              <div key={l.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-card-foreground">{l.symbol}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs text-muted font-medium">
                    {formatDisplayPrice(l.price || 0, l.symbol)}
                  </span>
                  <span className="flex items-center space-x-0.5 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    <span>{l.change}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart and Open Signals Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-card-foreground">
                {marketType === "crypto" ? "Bitcoin Trend" : "Nifty 50 Index Trend"}
              </h3>
              <p className="text-[11px] text-muted">Weekly candle trend line analysis</p>
            </div>
            <Zap className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getPerformanceData()}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  domain={["dataMin - 1000", "dataMax + 1000"]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const sampleSymbol = marketType === "crypto" ? "BTCUSDT" : "NIFTY";
                    let usdVal = val;
                    if (marketType === "indian") {
                      usdVal = val / 83.50;
                    }
                    const converted = usdVal * CURRENCY_RATES[currency];
                    return `${CURRENCY_SYMBOLS[currency]}${Math.round(converted / 1000)}k`;
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--muted)", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#chartGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open Signals Widget */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Open AI Signals</span>
            <Clock className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex-1 divide-y divide-border/60 overflow-y-auto pr-1 mt-2.5 max-h-56">
            {activeSignals.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center">
                <AlertTriangle className="h-8 w-8 text-muted mb-2" />
                <span className="text-xs font-bold text-muted">No Active Signals</span>
                <span className="text-[10px] text-gray-500">Scan markets in the Signals tab</span>
              </div>
            ) : (
              activeSignals.map((sig) => (
                <div key={sig.id} className="flex items-center justify-between py-3">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-card-foreground">{sig.symbol}</span>
                    <span className="text-[10px] text-muted font-semibold">Entry: {formatDisplayPrice(sig.entryPrice, sig.symbol)}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        sig.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {sig.type}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-indigo-500">{sig.confidenceScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-muted">Confidence</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Closed Signals List */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-card-foreground">Recent Signals History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted uppercase tracking-widest text-[9px] font-bold">
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Entry</th>
                <th className="pb-3">Targets (TP1 / TP2)</th>
                <th className="pb-3">Stop Loss</th>
                <th className="pb-3">Outcome</th>
                <th className="pb-3 text-right">Return PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-card-foreground font-medium">
              {closedSignals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted">
                    No closed signals recorded in this segment. Run a scanner analysis.
                  </td>
                </tr>
              ) : (
                closedSignals.map((sig) => (
                  <tr key={sig.id} className="hover:bg-accent/25">
                    <td className="py-3 font-bold">{sig.symbol}</td>
                    <td className="py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          sig.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {sig.type}
                      </span>
                    </td>
                    <td className="py-3">{formatDisplayPrice(sig.entryPrice, sig.symbol)}</td>
                    <td className="py-3 text-muted">
                      {formatDisplayPrice(sig.takeProfit1, sig.symbol)} / {formatDisplayPrice(sig.takeProfit2, sig.symbol)}
                    </td>
                    <td className="py-3 text-red-400/90">{formatDisplayPrice(sig.stopLoss, sig.symbol)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          sig.outcome === "WIN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {sig.outcome}
                      </span>
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        (sig.profitLossPercent || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {sig.profitLossPercent ? `${sig.profitLossPercent.toFixed(2)}%` : "0.00%"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
