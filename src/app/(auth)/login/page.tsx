"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"trader" | "admin">("trader");
  const router = useRouter();

  const handleModeChange = (mode: "trader" | "admin") => {
    setLoginMode(mode);
    setError(null);
    if (mode === "admin") {
      setEmail("shalinisree13@gmail.com");
      setPassword("shalini1307");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);

    const normEmail = email.toLowerCase().trim();

    try {
      // If it's the admin credential request
      if (normEmail === "shalinisree13@gmail.com" && password === "shalini1307") {
        let adminUser;
        try {
          const res = await signInWithEmailAndPassword(auth, normEmail, password);
          adminUser = res.user;
        } catch (loginErr: any) {
          if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
            // Auto register the admin account if it doesn't exist yet
            const res = await createUserWithEmailAndPassword(auth, normEmail, password);
            adminUser = res.user;
          } else {
            throw loginErr;
          }
        }

        // Initialize/Update settings with admin role & premium plan in Firestore
        const settingsRef = doc(db, "settings", adminUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        const adminSettings = {
          userId: adminUser.uid,
          email: normEmail,
          plan: "premium",
          role: "admin",
          currency: "USD",
          theme: "dark",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          createdAt: new Date().toISOString(),
        };

        if (settingsSnap.exists()) {
          await updateDoc(settingsRef, { role: "admin", plan: "premium", email: normEmail });
        } else {
          await setDoc(settingsRef, adminSettings);
        }

        router.push("/dashboard");
        return;
      }

      // Normal user login flow
      await signInWithEmailAndPassword(auth, normEmail, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Initialize settings/user entry if new
      const settingsRef = doc(db, "settings", user.uid);
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        const defaultSettings = {
          userId: user.uid,
          currency: "USD",
          theme: "dark",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          brokerSettings: {
            defaultLotSize: 0.1,
            defaultRiskPct: 1,
            defaultBroker: "MetaTrader 5",
          },
          notifications: {
            dailyReminder: true,
            summaries: true,
            riskAlert: true,
            overtradingAlert: true,
            revengeTradingAlert: true,
          },
          createdAt: new Date().toISOString(),
        };
        await setDoc(settingsRef, defaultSettings);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      {loginMode === "admin" && (
        <div className="absolute inset-0 bg-purple-600/5 mix-blend-color pointer-events-none" />
      )}

      <div className="w-full max-w-md space-y-6 glass-card p-8 rounded-2xl relative z-10 border border-gray-800/80">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
            <span className="text-lg font-bold text-white tracking-wider">TS</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            {loginMode === "admin" ? "Admin Workspace Portal" : "Welcome back"}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {loginMode === "admin" ? "Provide supervisor authorization keys." : "Log in to manage your trades with AI insights."}
          </p>
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex rounded-lg overflow-hidden border border-gray-800 bg-[#0a0f1e] p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange("trader")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
              loginMode === "trader" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Trader Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("admin")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all ${
              loginMode === "admin" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🛡️ Admin Sign In
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-3.5">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-9 sm:text-xs"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input block w-full pl-9 sm:text-xs"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500/50"
              />
              <label htmlFor="remember-me" className="ml-1.5 block text-gray-400">
                Remember me
              </label>
            </div>

            <Link
              href="/forgot-password"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group relative flex w-full justify-center rounded-xl py-2.5 px-4 text-xs font-semibold text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
              loginMode === "admin"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400 focus:ring-purple-500/50"
                : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 focus:ring-blue-500/50"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1">
                {loginMode === "admin" ? "Authorize Admin Access" : "Log In"}{" "}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </button>
        </form>

        {loginMode === "trader" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#020617] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-800 bg-[#0f172a] hover:bg-[#1e293b] py-3 px-4 text-sm font-medium text-white transition-colors cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </>
          )}
        </button>
        </>
        )}

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
