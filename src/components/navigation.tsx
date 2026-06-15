"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useStore } from "@/hooks/use-store";
import {
  TrendingUp,
  LayoutDashboard,
  LineChart,
  Signal,
  History,
  Bell,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Activity,
  UserCheck,
  Sun,
  Moon,
} from "lucide-react";

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { wsStatus, connectWebSocket, disconnectWebSocket, theme, toggleTheme, initTheme, currency, setCurrency } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Theme and WebSocket connections
  useEffect(() => {
    initTheme();
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, initTheme]);

  // Auth guard: redirect to login if not authenticated (except login/register)
  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [status, pathname, router]);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Market Live", href: "/market", icon: LineChart },
    { name: "Trading Signals", href: "/signals", icon: Signal },
    { name: "Backtesting", href: "/backtest", icon: History },
    { name: "Alert Manager", href: "/alerts", icon: Bell },
    { name: "Profile & Tier", href: "/profile", icon: User },
  ];

  // Add Admin Panel link if user role is ADMIN
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  if (isAdmin) {
    navLinks.push({ name: "Admin Console", href: "/admin", icon: Shield });
  }

  // If in login/register flow, do not render layout chrome
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b0f] text-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-medium tracking-wide text-gray-400">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      {/* Mobile Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-[#0d111b] dark:bg-[#0d111b] px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white dark:text-white tracking-tight text-lg">WebNex AI</span>
        </Link>
        <div className="flex items-center space-x-3">
          {/* Currency Dropdown Mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="bg-[#161b26] text-[10px] font-bold text-gray-300 rounded-lg px-1.5 py-1.5 border border-gray-700/60 focus:outline-none cursor-pointer"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>

          {/* Theme Toggle Button Mobile */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#161b26] hover:text-yellow-400"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* WS Indicator */}
          <div className="flex items-center space-x-1.5 rounded-full bg-[#161b26] px-2.5 py-1 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                wsStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : wsStatus === "connecting"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-gray-400 text-[10px] uppercase font-semibold">{wsStatus}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#161b26] hover:text-white"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation for Desktop */}
      <aside className="hidden w-64 flex-col border-r border-border bg-[#0d111b] dark:bg-[#0d111b] lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/10">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white dark:text-white tracking-wide text-xl">WebNex AI</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 glow-indigo"
                    : "text-gray-400 hover:bg-accent/80 hover:text-gray-200"
                }`}
                id={`sidebar-${link.name.toLowerCase().replace(/ /g, "-")}`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Connection Indicator */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between rounded-xl bg-input p-3 border border-border">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[85px] truncate text-xs font-semibold text-card-foreground">
                  {session?.user?.name || "Trader"}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  {(session?.user as any)?.role || "USER"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Currency Dropdown Desktop */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-[#1f2638] text-[10px] font-bold text-gray-300 rounded-lg px-1.5 py-1 border border-gray-700/60 mr-2 focus:outline-none cursor-pointer"
                title="Select Display Currency"
                id="currency-select-btn"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>

              {/* Theme Toggle Button Desktop */}
              <button
                onClick={toggleTheme}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1f2638] hover:text-yellow-400 mr-0.5"
                title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                id="theme-toggle-btn"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1f2638] hover:text-red-400"
                title="Sign Out"
                id="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center space-x-2 rounded-lg bg-background py-1.5 text-xs text-gray-400">
            <span
              className={`h-2 w-2 rounded-full ${
                wsStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : wsStatus === "connecting"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-[10px] font-medium uppercase tracking-wide">Live Feed: {wsStatus}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d111b] lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="font-bold text-white text-lg">WebNex AI</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-[#161b26] hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1.5 px-4 py-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-semibold ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                      : "text-gray-400 hover:bg-[#161b26] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-200">{session?.user?.name}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  {(session?.user as any)?.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center space-x-2 rounded-xl bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-600/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 bg-background">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
