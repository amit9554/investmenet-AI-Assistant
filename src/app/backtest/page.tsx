"use client";

import React, { useEffect, useState } from "react";
import {
  RotateCw,
  Play,
  TrendingUp,
  Percent,
  Activity,
  History,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  LineChart as RechartsLineIcon,
  HelpCircle,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from "recharts";

export default function Backtest() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [startDate, setStartDate] = useState("2026-05-15");
  const [endDate, setEndDate] = useState("2026-06-15");
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/backtest");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.backtests || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          timeframe,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to execute backtest");
      } else {
        setResults(data);
        fetchHistory(); // refresh history
      }
    } catch (err) {
      setError("Failed to run backtest simulation. Please check database connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-outfit">
          Backtesting Sandbox
        </h1>
        <p className="text-sm text-gray-400 font-medium">Test trading strategies over historical market data offline</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Form panel */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 h-fit space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-900/60 pb-2 block">
            Simulation Settings
          </span>

          <form onSubmit={handleRunBacktest} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-400 mb-2">Target Asset</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none transition focus:border-indigo-500"
              >
                <option value="BTCUSDT">Bitcoin (BTCUSDT)</option>
                <option value="ETHUSDT">Ethereum (ETHUSDT)</option>
                <option value="SOLUSDT">Solana (SOLUSDT)</option>
                <option value="BNBUSDT">BNB (BNBUSDT)</option>
                <option value="XRPUSDT">Ripple (XRPUSDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none transition focus:border-indigo-500"
              >
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">Daily (1d)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              id="backtest-submit-btn"
            >
              {loading ? (
                <RotateCw className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-white" />
              )}
              <span>{loading ? "Simulating..." : "Execute Simulation"}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-xs font-semibold text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!results && !loading && (
            <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-16 text-center">
              <History className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-gray-400">Run a Strategy Simulation</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Configure your target parameters on the left and click execute. We will analyze historical ticks to verify ROI.
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-24 text-center space-y-3">
              <RotateCw className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
              <div className="text-sm font-bold text-gray-400">Processing Historical Candles...</div>
              <div className="text-xs text-gray-600">Simulating entries and exits with stop losses.</div>
            </div>
          )}

          {results && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                {[
                  { label: "ROI Return", val: `${results.roi}%`, color: results.roi >= 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Win Rate", val: `${results.winRate}%`, color: "text-indigo-400" },
                  { label: "Profit Factor", val: results.profitFactor, color: "text-gray-200" },
                  { label: "Max Drawdown", val: `${results.drawdown}%`, color: "text-red-400" },
                  { label: "Total Trades", val: results.totalTrades, color: "text-gray-200" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border border-gray-900 bg-[#0d111b] p-4 text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">{stat.label}</span>
                    <div className={`text-xl font-extrabold mt-1 ${stat.color}`}>{stat.val}</div>
                  </div>
                ))}
              </div>

              {/* Equity curve chart */}
              <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Equity Growth Curve</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.equityCurve}>
                      <defs>
                        <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#4b5563"
                        fontSize={9}
                        tickLine={false}
                        tickFormatter={(val) => `$${val}`}
                        domain={["dataMin - 500", "dataMax + 500"]}
                      />
                      <Tooltip contentStyle={{ backgroundColor: "#121620", borderColor: "#1f2937" }} />
                      <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#eqGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trades breakdown table */}
              <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Detailed Transaction Log</h3>
                <div className="overflow-x-auto max-h-80 pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Entry Time</th>
                        <th className="pb-3">Entry Price</th>
                        <th className="pb-3">Exit Time</th>
                        <th className="pb-3">Exit Price</th>
                        <th className="pb-3 text-right">PnL Percent</th>
                        <th className="pb-3 text-right">Profit / Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/60 text-gray-300 font-medium">
                      {results.trades.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-gray-500">
                            Strategy filters returned no trades in this period.
                          </td>
                        </tr>
                      ) : (
                        results.trades.map((t: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#121620]/30">
                            <td className="py-3">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  t.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 text-gray-400">{new Date(t.entryTime).toLocaleDateString()}</td>
                            <td className="py-3">${t.entryPrice.toFixed(2)}</td>
                            <td className="py-3 text-gray-400">{new Date(t.exitTime).toLocaleDateString()}</td>
                            <td className="py-3">${t.exitPrice.toFixed(2)}</td>
                            <td
                              className={`py-3 text-right font-bold ${
                                t.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {t.pnlPercent >= 0 ? "+" : ""}
                              {t.pnlPercent.toFixed(2)}%
                            </td>
                            <td
                              className={`py-3 text-right font-bold ${
                                t.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {t.profitLoss >= 0 ? "+" : ""}
                              ${t.profitLoss.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
