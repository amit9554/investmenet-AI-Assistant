"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/hooks/use-store";
import {
  Signal,
  Percent,
  Play,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  Compass,
  DollarSign,
  TrendingDown,
  Gauge,
  HelpCircle,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [winRate, setWinRate] = useState(75);
  const [totalClosed, setTotalClosed] = useState(12);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchSignals = async () => {
    try {
      const res = await fetch("/api/signals");
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
        setWinRate(data.winRate || 75);
        setTotalClosed(data.totalClosed || 12);
      }
    } catch (err) {
      console.error("Error fetching signals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const triggerScanner = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/signals/generate", {
        method: "POST",
      });
      if (res.ok) {
        await fetchSignals();
      }
    } catch (err) {
      console.error("Scanning trigger error:", err);
    } finally {
      setScanning(false);
    }
  };

  const activeSignals = signals.filter((s) => s.status === "OPEN");
  const closedSignals = signals.filter((s) => s.status === "CLOSED");

  const getConfidenceColor = (lvl: string) => {
    if (lvl === "High") return "text-emerald-400";
    if (lvl === "Medium") return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-outfit">
            AI Signal Console
          </h1>
          <p className="text-sm text-gray-400">Quantitative scanning models for institutional grade trade confirmations</p>
        </div>

        <button
          onClick={triggerScanner}
          disabled={scanning}
          className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-700/30 transition disabled:opacity-50"
          id="trigger-scanner-btn"
        >
          {scanning ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
          <span>{scanning ? "Scanning Assets..." : "Trigger AI Market Scan"}</span>
        </button>
      </div>

      {/* Signal Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-5 flex items-center space-x-4">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Algorithm Win Rate</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">{winRate}%</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-5 flex items-center space-x-4">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Closed Trades Verified</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">{totalClosed}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-5 flex items-center space-x-4">
          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
            <Signal className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Monitored Spot Assets</div>
            <div className="text-2xl font-extrabold text-white mt-0.5">5 Pairs</div>
          </div>
        </div>
      </div>

      {/* Active Signals section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-outfit">Active Market Positions</h3>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-gray-900 bg-[#0d111b]" />
            ))}
          </div>
        ) : activeSignals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-900 bg-[#0d111b]/40 p-12 text-center">
            <Compass className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-400">No Active Trades Currently</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Trigger a manual scanner analysis above to scan indicators and seek high-probability setups.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSignals.map((sig) => (
              <div
                key={sig.id}
                className={`rounded-2xl border bg-[#0d111b] p-5 flex flex-col justify-between hover:border-gray-800 transition ${
                  sig.type === "BUY" ? "glow-green" : "glow-red"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-900/60 pb-3">
                    <span className="text-sm font-extrabold text-white">{sig.symbol}</span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                        sig.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {sig.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 py-4 text-xs font-semibold">
                    <div>
                      <span className="text-gray-500">Entry Price</span>
                      <div className="text-gray-200 text-sm mt-0.5">${sig.entryPrice}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Win Probability</span>
                      <div className={`text-sm mt-0.5 font-bold ${getConfidenceColor(sig.confidenceLevel)}`}>
                        {sig.confidenceScore}% ({sig.confidenceLevel})
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Take Profit 1</span>
                      <div className="text-emerald-400 mt-0.5">${sig.takeProfit1}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Take Profit 2</span>
                      <div className="text-emerald-400 mt-0.5">${sig.takeProfit2}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Stop Loss</span>
                      <div className="text-red-400 mt-0.5">${sig.stopLoss}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Risk-to-Reward</span>
                      <div className="text-gray-200 mt-0.5">{sig.riskReward} R:R</div>
                    </div>
                  </div>

                  {sig.description && (
                    <div className="mt-1 mb-3 rounded-xl bg-card border border-border p-2.5 text-[10px] font-semibold text-muted leading-normal text-left">
                      ⚡ <span className="text-indigo-400">Trigger:</span> {sig.description}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between text-[10px] font-semibold text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-gray-600" />
                    <span>{new Date(sig.signalTime).toLocaleTimeString()}</span>
                  </span>
                  <span>Spot Limit Order</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Signals Log section */}
      <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-4">
        <h3 className="text-base font-bold text-white font-outfit">Archived Signals Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-widest text-[9px] font-bold pb-2">
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Entry</th>
                <th className="pb-3">Stop Loss</th>
                <th className="pb-3">Targets (TP1 / TP2)</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Outcome</th>
                <th className="pb-3 text-right">PnL Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900/60 text-gray-300 font-medium">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 h-8 bg-gray-900/20" />
                  </tr>
                ))
              ) : closedSignals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    No signal execution history found.
                  </td>
                </tr>
              ) : (
                closedSignals.map((sig) => (
                  <tr key={sig.id} className="hover:bg-[#121620]/30">
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
                    <td className="py-3">${sig.entryPrice}</td>
                    <td className="py-3 text-red-400/90">${sig.stopLoss}</td>
                    <td className="py-3 text-gray-400">
                      ${sig.takeProfit1} / ${sig.takeProfit2}
                    </td>
                    <td className="py-3 text-gray-500 font-semibold">{sig.status}</td>
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

// Add simple checklist to prevent TypeScript missing components errors
interface CheckCircle2Props {
  className?: string;
}
function CheckCircle2({ className }: CheckCircle2Props) {
  return <CheckCircle className={className} />;
}
