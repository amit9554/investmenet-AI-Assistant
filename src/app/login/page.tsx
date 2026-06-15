"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b0f] px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-900 bg-[#0d111b] p-8 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white font-outfit">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400 font-medium">
            Sign in to access your AI trading dashboard
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gray-800 bg-[#121620] pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-indigo-500"
                  placeholder="you@example.com"
                  id="login-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-800 bg-[#121620] pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-indigo-500"
                  placeholder="••••••••"
                  id="login-password-input"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-800 bg-[#121620] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#090b0f]"
                id="remember-me"
              />
              <label className="ml-2 block text-xs text-gray-400 font-semibold cursor-pointer">
                Remember me
              </label>
            </div>
            <div className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              <Link href="#">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            id="login-submit-btn"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0d111b] px-3 font-semibold text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center space-x-2.5 rounded-xl border border-gray-800 bg-[#121620] py-3 text-sm font-semibold text-gray-300 hover:bg-[#1f2638] hover:text-white transition"
          id="google-login-btn"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.47 0 2.82.529 3.88 1.41l3.12-3.12C18.99 1.83 15.82 1 12.24 1 6.04 1 1 6.04 1 12.24s5.04 11.24 11.24 11.24c5.96 0 11.02-4.29 11.02-11.24 0-.68-.06-1.34-.17-1.956H12.24Z"
            />
          </svg>
          <span>Google Accounts</span>
        </button>

        <p className="mt-8 text-center text-xs text-gray-400 font-semibold">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
