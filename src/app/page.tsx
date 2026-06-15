import React from "react";
import Link from "next/link";
import { TrendingUp, Shield, Activity, Bell, History, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090b0f] px-6 text-center">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <span className="text-3xl font-extrabold text-white tracking-wide font-outfit">WebNex AI</span>
      </div>

      {/* Hero */}
      <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-outfit leading-tight mb-6">
        Next-Generation AI Crypto <br />
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
          Trading Assistant
        </span>
      </h1>

      <p className="max-w-xl text-lg text-gray-400 font-medium leading-relaxed mb-10">
        Analyze real-time market data, calculate indicators, detect breakouts, and receive high-probability, risk-managed trading signals automatically.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
        <Link
          href="/register"
          className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 hover:shadow-indigo-700/30"
          id="btn-get-started"
        >
          <span>Get Started Free</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-gray-800 bg-[#0d111b]/80 px-8 py-4 text-base font-bold text-gray-300 hover:bg-[#161b26] hover:text-white transition-all"
          id="btn-login-landing"
        >
          Sign In
        </Link>
      </div>

      {/* Feature grid */}
      <div className="grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Technical TA Engine",
            desc: "Auto-calculates RSI, MACD, Bollinger Bands, VWAP, Volume Profiles, and Pivot zones.",
            icon: Activity,
          },
          {
            title: "AI Signal Scanning",
            desc: "Identifies breakout, pullback, and trend reversal setups using multi-factor verification.",
            icon: TrendingUp,
          },
          {
            title: "Risk Management",
            desc: "Calculates precise Stop Loss and Take Profit levels with optimized risk-to-reward ratios.",
            icon: Shield,
          },
          {
            title: "Multi-Channel Alerts",
            desc: "Get real-time indicators sent straight to your device via In-App logs, Telegram, or Email.",
            icon: Bell,
          },
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 text-left hover:border-gray-800 transition-all duration-200"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-200 mb-2 font-outfit">{feat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-normal">{feat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Disclaimers */}
      <div className="mt-20 max-w-2xl border-t border-gray-900 pt-8 text-xs text-gray-500 leading-normal">
        <p className="mb-2">⚠️ Disclaimer: Cryptocurrencies are highly volatile assets. Trading carries high risk.</p>
        <p>WebNex AI provides data-driven statistical analysis and mathematical indicators. We do NOT guarantee profits or promise 100% accuracy. Never trade with capital you cannot afford to lose.</p>
      </div>
    </div>
  );
}
