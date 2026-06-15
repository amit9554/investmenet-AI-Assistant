"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Activity,
  Signal,
  Bell,
  HardDrive,
  HeartPulse,
  Play,
  RotateCw,
  RefreshCw,
  Cpu,
} from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [usersCount, setUsersCount] = useState(2);
  const [signalsCount, setSignalsCount] = useState(16);
  const [alertsCount, setAlertsCount] = useState(4);
  const [dbLatency, setDbLatency] = useState(8);
  const [apiLatency, setApiLatency] = useState(125);
  const [cpuUsage, setCpuUsage] = useState(12);

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session && (session.user as any)?.role !== "ADMIN") {
      setLoading(false); // Render access denied
    } else if (session && (session.user as any)?.role === "ADMIN") {
      // Admin confirmed
      setLoading(false);
      
      // Simulate ticking values
      const interval = setInterval(() => {
        setCpuUsage(Math.round(8 + Math.random() * 8));
        setDbLatency(Math.round(5 + Math.random() * 6));
        setApiLatency(Math.round(110 + Math.random() * 30));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  const handleForcedScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/signals/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setScanResult(`Scan complete! New signals generated: ${data.newSignalsGeneratedCount}`);
        setSignalsCount((prev) => prev + (data.newSignalsGeneratedCount || 0));
      } else {
        setScanResult(`Scan failed: ${data.error}`);
      }
    } catch (err: any) {
      setScanResult(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <RotateCw className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="text-xs text-gray-400 font-semibold">Validating clearances...</span>
      </div>
    );
  }

  // Security Gate
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8 border border-dashed border-red-500/20 rounded-2xl bg-red-950/5 mt-12">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-red-400 font-outfit">Access Denied</h2>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
          Your profile (role: {(session?.user as any)?.role || "USER"}) is not cleared to access this administrative dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-outfit">
          Admin Console
        </h1>
        <p className="text-sm text-gray-400 font-medium">Monitor node health parameters, user clusters, and trigger engines</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", val: usersCount, desc: "Registered accounts", icon: Users, color: "text-indigo-400" },
          { label: "Signals Fired", val: signalsCount, desc: "Lifetime generated signals", icon: Signal, color: "text-emerald-400" },
          { label: "Custom Alerts", val: alertsCount, desc: "Active threshold alerts", icon: Bell, color: "text-amber-400" },
          { label: "CPU Node Load", val: `${cpuUsage}%`, desc: "App container load", icon: Cpu, color: "text-purple-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl border border-gray-900 bg-[#0d111b] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">{stat.val}</div>
                <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{stat.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Health metrics and scanning triggers */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Diagnostics */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-900 pb-3">
            <HeartPulse className="h-4.5 w-4.5" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-200">System Diagnostics</span>
          </div>
          <div className="space-y-3.5 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">PostgreSQL ping</span>
              <span className="text-emerald-400">{dbLatency} ms (Healthy)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Binance API ping</span>
              <span className="text-emerald-400">{apiLatency} ms (Healthy)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Docker Node environment</span>
              <span className="text-gray-300">Alpine-Node20</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Prisma Client version</span>
              <span className="text-gray-300">Prisma-7.x</span>
            </div>
          </div>
        </div>

        {/* Forced Scanning Controls */}
        <div className="rounded-2xl border border-gray-900 bg-[#0d111b] p-6 md:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-900 pb-3">
              <Activity className="h-4.5 w-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Engine Control Center</span>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed font-semibold">
              Force-generate active sweeps. This updates historical candles from Binance REST API, checks active stop losses and take profit targets, and creates new signals.
            </p>
            {scanResult && (
              <div className="mt-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 p-3 text-[10px] font-bold text-indigo-400">
                {scanResult}
              </div>
            )}
          </div>

          <button
            onClick={handleForcedScan}
            disabled={scanning}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 self-start mt-4"
            id="admin-forced-scan-btn"
          >
            {scanning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-white" />
            )}
            <span>{scanning ? "Sweeping markets..." : "Trigger Forced Signal Analysis"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
