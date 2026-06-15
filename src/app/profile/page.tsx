"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  CreditCard,
  Check,
  ShieldCheck,
  Send,
  MessageSquare,
  AlertCircle,
  Activity,
  RotateCw,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [tier, setTier] = useState("PRO");
  const [tgChatId, setTgChatId] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading parameters
    setTimeout(() => {
      setTgChatId("123456789");
      setLoading(false);
    }, 500);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <Activity className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="text-xs text-gray-400 font-semibold">Syncing profile...</span>
      </div>
    );
  }

  const subscriptionTiers = [
    {
      name: "FREE",
      price: "$0",
      features: ["3 Monitored Assets", "In-App Notifications only", "Standard TA Indicators"],
      buttonText: "Current Plan",
      isActive: tier === "FREE",
    },
    {
      name: "PRO",
      price: "$49/mo",
      features: ["All Monitored Assets", "Telegram & Email Alerts", "Full AI Breakout Scanner", "Backtester Sandbox"],
      buttonText: "Active Plan",
      isActive: tier === "PRO",
    },
    {
      name: "VIP",
      price: "$149/mo",
      features: [
        "All Monitored Assets",
        "Instant Telegram Alerts",
        "Priority AI Confidence Engine",
        "Infinite Backtest Slots",
        "Direct API Integration support",
      ],
      buttonText: "Upgrade Tier",
      isActive: tier === "VIP",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-outfit">
          Profile Settings
        </h1>
        <p className="text-sm text-gray-400 font-medium">Manage credentials, notification integrations, and plans</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Stats Card */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 h-fit space-y-6">
          <div className="flex items-center space-x-3.5 border-b border-gray-900 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-outfit">{session?.user?.name || "Trader"}</h3>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                {(session?.user as any)?.role || "USER"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <span className="text-gray-500">Email Address</span>
              <div className="text-gray-200 mt-0.5">{session?.user?.email}</div>
            </div>
            <div>
              <span className="text-gray-500">Client UUID Reference</span>
              <div className="text-gray-200 mt-0.5 font-mono select-all">
                {(session?.user as any)?.id || "e3c88081-cf12-42bb-b0d7-ad348ea12210"}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Credentials Panel */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 lg:col-span-2 space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-900/60 pb-2 block">
            Telegram Integration Parameters
          </span>

          {success && (
            <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
              <span>Configurations saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-400 mb-2">Telegram Chat ID (Channel/Personal)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="block w-full rounded-xl border border-gray-800 bg-[#121620] pl-11 pr-4 py-3 text-white placeholder-gray-600 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              id="profile-save-btn"
            >
              {submitting ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{submitting ? "Saving Parameters..." : "Save Settings"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Subscription Pricing Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-outfit">Subscription Tiers</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {subscriptionTiers.map((item) => (
            <div
              key={item.name}
              className={`rounded-2xl border bg-[#0d111b] p-6 flex flex-col justify-between hover:border-gray-800 transition ${
                item.isActive ? "border-indigo-600 shadow-lg glow-indigo" : "border-gray-900"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
                    {item.name}
                  </span>
                  {item.isActive && (
                    <span className="rounded bg-indigo-600/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                      Current
                    </span>
                  )}
                </div>
                <div className="my-4 text-3xl font-extrabold text-white font-outfit">{item.price}</div>
                <ul className="space-y-2.5 text-xs text-gray-400 font-medium">
                  {item.features.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setTier(item.name)}
                disabled={item.isActive}
                className={`mt-8 w-full rounded-xl py-3 text-xs font-bold transition ${
                  item.isActive
                    ? "bg-indigo-600 text-white cursor-default"
                    : "bg-[#121620] border border-gray-800 text-gray-300 hover:bg-[#1f2638] hover:text-white"
                }`}
              >
                {item.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
