"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  PlusSquare,
  BarChart3,
  BrainCircuit,
  Eye,
  Target,
  MessageSquare,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Crown,
  Zap,
  FlaskConical,
  Trees,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "New Trade", href: "/trade-entry", icon: PlusSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Psychology", href: "/psychology", icon: BrainCircuit },
  { name: "Watchlist", href: "/watchlist", icon: Eye },
  { name: "Pine Script", href: "/pine-script", icon: Trees },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "AI Coach", href: "/ai-coach", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, accountMode, setAccountMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {}
    setMobileOpen(false);
  };

  const AccountToggle = () => (
    <div className="mx-3 mb-3">
      <p className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold mb-1.5 px-1">Account</p>
      <div className="flex rounded-lg overflow-hidden border border-gray-800 bg-[#0a0f1e]">
        <button
          onClick={() => setAccountMode("real")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
            accountMode === "real"
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Zap className="h-3 w-3" />
          Real
        </button>
        <button
          onClick={() => setAccountMode("demo")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
            accountMode === "demo"
              ? "bg-emerald-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <FlaskConical className="h-3 w-3" />
          Demo
        </button>
      </div>
      {accountMode === "demo" && (
        <p className="text-[9px] text-emerald-500 text-center mt-1 font-medium">
          ● Demo mode — trades are simulated
        </p>
      )}
    </div>
  );

  const NavLinks = () => (
    <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {/* Premium CTA */}
      <Link
        href="/premium"
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors mt-1 ${
          pathname === "/premium"
            ? "bg-yellow-500/15 text-yellow-400 border-l-2 border-yellow-500"
            : "text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
        }`}
      >
        <Crown className="h-4.5 w-4.5 shrink-0" />
        <span>Upgrade to Premium</span>
      </Link>
    </nav>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────── */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-[#07090f] border-r border-gray-800/60 z-30">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-800/60 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500">
            <span className="text-xs font-bold text-white">TS</span>
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent leading-none">
              TradeSense
            </p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">AI Journal</p>
          </div>
        </div>

        <NavLinks />
        <AccountToggle />

        {/* User footer */}
        <div className="border-t border-gray-800/60 p-3 shrink-0">
          <div className="flex items-center gap-2 px-1 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 shrink-0">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────── */}
      <header className="flex md:hidden h-14 items-center justify-between px-4 bg-[#07090f] border-b border-gray-800/60 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500">
            <span className="text-xs font-bold text-white">TS</span>
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            TradeSense AI
          </span>
          {accountMode === "demo" && (
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider">
              Demo
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-400 hover:text-white cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* ── MOBILE DRAWER ───────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex w-72 max-w-[85vw] flex-col bg-[#07090f] border-r border-gray-800 h-full shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500">
                  <span className="text-xs font-bold text-white">TS</span>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  TradeSense AI
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-800/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600/30 to-emerald-600/30 border border-gray-700 shrink-0">
                  <UserIcon className="h-4 w-4 text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user?.displayName || "Trader"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <NavLinks />
            <AccountToggle />

            {/* Sign out */}
            <div className="p-3 border-t border-gray-800 shrink-0">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
