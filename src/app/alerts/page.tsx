"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Sliders,
  Send,
  CheckCircle,
  Clock,
  Settings,
  Mail,
  MessageSquare,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

export default function AlertsPage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [condition, setCondition] = useState("ABOVE");
  const [value, setValue] = useState("");
  const [channels, setChannels] = useState<string[]>(["IN_APP"]);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleChannelToggle = (channel: string) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          type: "PRICE",
          condition,
          value: parseFloat(value),
          channels,
        }),
      });

      if (res.ok) {
        setValue("");
        setSuccessMsg("Price alert configured successfully!");
        fetchAlerts();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-outfit">
          Alert Manager
        </h1>
        <p className="text-sm text-gray-400 font-medium">Configure custom price notifications and channel triggers</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Alert Form */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 h-fit space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-900/60 pb-2 block">
            Configure Price Trigger
          </span>

          {successMsg && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAlert} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-400 mb-2">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none focus:border-indigo-500"
              >
                <option value="BTCUSDT">Bitcoin (BTCUSDT)</option>
                <option value="ETHUSDT">Ethereum (ETHUSDT)</option>
                <option value="SOLUSDT">Solana (SOLUSDT)</option>
                <option value="BNBUSDT">BNB (BNBUSDT)</option>
                <option value="XRPUSDT">Ripple (XRPUSDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white outline-none focus:border-indigo-500"
              >
                <option value="ABOVE">Price Goes ABOVE</option>
                <option value="BELOW">Price Goes BELOW</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Threshold Price (USD)</label>
              <input
                type="number"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 70000"
                className="block w-full rounded-xl border border-gray-800 bg-[#121620] px-3.5 py-3 text-white placeholder-gray-600 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Delivery channels */}
            <div className="space-y-2.5">
              <label className="block text-gray-400">Dispatch Channels</label>
              <div className="space-y-2">
                {[
                  { name: "IN_APP", display: "In-App Notifications Log", icon: Bell },
                  { name: "TELEGRAM", display: "Telegram Bot Broadcast", icon: MessageSquare },
                  { name: "EMAIL", display: "Email Alerts SMTP", icon: Mail },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = channels.includes(ch.name);
                  return (
                    <div
                      key={ch.name}
                      onClick={() => handleChannelToggle(ch.name)}
                      className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-600/5 text-white"
                          : "border-gray-900 bg-[#121620] text-gray-400 hover:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="h-4.5 w-4.5" />
                        <span className="text-xs font-semibold">{ch.display}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="h-4 w-4 rounded border-gray-800 bg-[#121620] text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              id="alert-submit-btn"
            >
              {submitting ? (
                <RotateCw className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5" />
              )}
              <span>Create Alert Trigger</span>
            </button>
          </form>
        </div>

        {/* Alerts Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channel Integration settings info */}
          <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Settings className="h-5 w-5" />
              <h3 className="text-sm font-bold text-gray-200">Channel Integration Guides</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              To hook Telegram alerts, insert the WebNex Bot into your chat channel, and configure your Bot API parameters inside your Profile Configuration. Mock delivery channels will fallback automatically to console logging.
            </p>
          </div>

          {/* Active / Triggered alerts log table */}
          <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 font-outfit">Configured Alert Logs</h3>
            <div className="overflow-x-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-900 text-gray-500 uppercase tracking-widest text-[9px] font-bold pb-2">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Condition</th>
                    <th className="pb-3">Target Price</th>
                    <th className="pb-3">Channels</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/60 text-gray-300 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center">
                        <RotateCw className="h-5 w-5 animate-spin text-indigo-500 mx-auto" />
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500 font-semibold">
                        No custom alerts configured. Build a price trigger.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((al) => (
                      <tr key={al.id} className="hover:bg-[#121620]/30">
                        <td className="py-3 font-bold">{al.symbol}</td>
                        <td className="py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              al.condition === "ABOVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {al.condition}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">${al.value.toFixed(2)}</td>
                        <td className="py-3">
                          <div className="flex space-x-1.5 text-gray-400">
                            {al.channels.map((ch: string) => (
                              <span
                                key={ch}
                                className="rounded bg-gray-900 px-1 py-0.5 text-[8px] uppercase tracking-wider font-extrabold"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`flex items-center justify-end space-x-1 text-[10px] font-bold ${
                              al.isTriggered ? "text-emerald-400" : "text-gray-500"
                            }`}
                          >
                            {al.isTriggered ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Triggered</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
