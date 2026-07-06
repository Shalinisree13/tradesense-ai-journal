"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, where, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trade, calculateMetrics, calculateTradeProfit } from "@/lib/tradeUtils";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Calculator,
  DollarSign,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Flame,
  Award,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const DashboardChart = dynamic(() => import("@/components/DashboardChart"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-gray-800/10" />,
});

const TradingViewChart = dynamic(() => import("@/components/TradingViewChart"), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full animate-pulse rounded-xl bg-gray-800/10" />,
});

export default function Dashboard() {
  const { user, userSettings, accountMode, tradesCollection } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"equity" | "calendar" | "tradingview">("equity");

  const initialEquity = userSettings?.brokerSettings?.defaultEquity || 10000;

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, tradesCollection), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedTrades: Trade[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTrades.push({ id: doc.id, ...doc.data() } as Trade);
      });
      setTrades(fetchedTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [user, tradesCollection]);

  const handleGenerateDemoData = async () => {
    if (!user) return;
    setDemoLoading(true);
    try {
      const batch = writeBatch(db);
      const tradesRef = collection(db, "trades");
      
      const demoTradesList = [
        {
          title: "EURUSD Bullish Breakout",
          date: "2026-06-25",
          time: "10:15",
          market: "EURUSD",
          broker: "MetaTrader 5",
          assetType: "Forex",
          pair: "EUR/USD",
          direction: "Buy",
          entryPrice: 1.08500,
          exitPrice: 1.09200,
          stopLoss: 1.08200,
          takeProfit: 1.09400,
          riskPct: 1,
          lotSize: 1.5,
          quantity: 150000,
          fees: 7.5,
          commission: 3.5,
          slippage: 0,
          status: "Win",
          duration: 180,
          strategyUsed: "Order Block Breakout",
          setupName: "FVG Mitigation",
          timeframe: "15M",
          reasonEntry: "Strong bullish rejection off H4 Order Block with FVG validation.",
          reasonExit: "Hit H1 resistance level before major news release.",
          mistakes: "None",
          lessons: "Sticking to the higher timeframe structure pays off.",
          confidence: 4,
          emotionBefore: "Disciplined",
          emotionAfter: "Happy",
          marketCondition: "Trending",
          tags: ["bullish", "fvg", "h4-ob"],
          notes: "Excellent trade execution. Followed all rules.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          title: "BTCUSD Range Rejection",
          date: "2026-06-26",
          time: "14:30",
          market: "BTCUSD",
          broker: "Binance",
          assetType: "Crypto",
          pair: "BTC/USDT",
          direction: "Sell",
          entryPrice: 65200,
          exitPrice: 63800,
          stopLoss: 66100,
          takeProfit: 63000,
          riskPct: 1.5,
          lotSize: 0.1,
          quantity: 0.1,
          fees: 14,
          commission: 0,
          slippage: 2,
          status: "Win",
          duration: 320,
          strategyUsed: "Range Liquidity Sweep",
          setupName: "Deviation & Reclaim",
          timeframe: "1H",
          reasonEntry: "Sweep of range high deviation reclaim with bearish engulfing candle.",
          reasonExit: "Exit at mid-range support level.",
          mistakes: "None",
          lessons: "Range trading is highly reliable when waiting for the deviation.",
          confidence: 5,
          emotionBefore: "Confident",
          emotionAfter: "Disciplined",
          marketCondition: "Range",
          tags: ["crypto", "range", "deviation"],
          notes: "Perfect risk control.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          title: "Gold FOMO Entry",
          date: "2026-06-28",
          time: "16:05",
          market: "XAUUSD",
          broker: "MetaTrader 5",
          assetType: "Commodities",
          pair: "XAU/USD",
          direction: "Buy",
          entryPrice: 2345.50,
          exitPrice: 2330.00,
          stopLoss: 2340.00,
          takeProfit: 2365.00,
          riskPct: 2,
          lotSize: 0.8,
          quantity: 80,
          fees: 8,
          commission: 4,
          slippage: 3,
          status: "Loss",
          duration: 45,
          strategyUsed: "Trend Following",
          setupName: "Impulse Chase",
          timeframe: "5M",
          reasonEntry: "Chased the price upwards after a massive green candle without waiting for a pullback.",
          reasonExit: "Hit stop loss during retracement.",
          mistakes: "FOMO, Chasing Price",
          lessons: "Never chase green candles. Wait for pullbacks to value zones.",
          confidence: 2,
          emotionBefore: "FOMO",
          emotionAfter: "Frustrated",
          marketCondition: "Volatile",
          tags: ["gold", "loss", "fomo"],
          notes: "Felt rushed to enter because I missed the initial move.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          title: "Nasdaq Reversal Play",
          date: "2026-06-29",
          time: "09:45",
          market: "US100",
          broker: "MetaTrader 5",
          assetType: "Indices",
          pair: "NAS100",
          direction: "Sell",
          entryPrice: 19800,
          exitPrice: 19680,
          stopLoss: 19880,
          takeProfit: 19550,
          riskPct: 1,
          lotSize: 2.0,
          quantity: 2,
          fees: 12,
          commission: 2,
          slippage: 1,
          status: "Win",
          duration: 90,
          strategyUsed: "Liquidity Sweep",
          setupName: "London Session Sweep",
          timeframe: "15M",
          reasonEntry: "London high sweep during NY morning session open.",
          reasonExit: "Targeted London session lows.",
          mistakes: "None",
          lessons: "Sweep of high/low works beautifully during NY Open.",
          confidence: 4,
          emotionBefore: "Disciplined",
          emotionAfter: "Happy",
          marketCondition: "Volatile",
          tags: ["nas100", "ny-open", "london-sweep"],
          notes: "Clean exit at target.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          title: "GBPUSD Support Bounce",
          date: "2026-06-30",
          time: "11:20",
          market: "GBPUSD",
          broker: "MetaTrader 5",
          assetType: "Forex",
          pair: "GBP/USD",
          direction: "Buy",
          entryPrice: 1.26800,
          exitPrice: 1.26550,
          stopLoss: 1.26550,
          takeProfit: 1.27400,
          riskPct: 1,
          lotSize: 2.5,
          quantity: 250000,
          fees: 10,
          commission: 4.5,
          slippage: 0,
          status: "Loss",
          duration: 120,
          strategyUsed: "Support/Resistance",
          setupName: "Double Bottom",
          timeframe: "30M",
          reasonEntry: "Double bottom at key daily support level.",
          reasonExit: "Stop loss hit after price broke support.",
          mistakes: "None",
          lessons: "Losses are part of the game. Risk was managed correctly.",
          confidence: 3,
          emotionBefore: "Confident",
          emotionAfter: "Disciplined",
          marketCondition: "Trending",
          tags: ["gbpusd", "support", "loss"],
          notes: "Acceptable loss. Setup was valid.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          title: "Solana Trend Continuation",
          date: "2026-07-01",
          time: "08:10",
          market: "SOLUSD",
          broker: "Bybit",
          assetType: "Crypto",
          pair: "SOL/USDT",
          direction: "Buy",
          entryPrice: 135.20,
          exitPrice: 142.80,
          stopLoss: 132.00,
          takeProfit: 145.00,
          riskPct: 1,
          lotSize: 5,
          quantity: 25,
          fees: 6,
          commission: 2,
          slippage: 0,
          status: "Win",
          duration: 480,
          strategyUsed: "Trend Following",
          setupName: "EMA Bounce",
          timeframe: "4H",
          reasonEntry: "Retest of 21 EMA in strong uptrend on H4.",
          reasonExit: "Exit at key psychological level ($142.80).",
          mistakes: "None",
          lessons: "Patience to wait for the EMA bounce leads to high RR trades.",
          confidence: 4,
          emotionBefore: "Disciplined",
          emotionAfter: "Happy",
          marketCondition: "Trending",
          tags: ["crypto", "solana", "ema-retest"],
          notes: "Very clean trade execution.",
          tvUrl: "",
          screenshots: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      for (const t of demoTradesList) {
        const docRef = doc(tradesRef);
        batch.set(docRef, { ...t, userId: user.uid });
      }

      // Add a watchlist entry
      const watchlistRef = doc(collection(db, "watchlists"));
      batch.set(watchlistRef, {
        userId: user.uid,
        symbol: "AAPL",
        notes: "Wait for $180 support retest.",
        target: 180,
        alertPrice: 181,
        status: "active",
        createdAt: new Date().toISOString()
      });

      // Add a goal entry
      const goalRef = doc(collection(db, "goals"));
      batch.set(goalRef, {
        userId: user.uid,
        type: "weekly",
        targetAmount: 500,
        currentAmount: 320,
        maxDrawdown: 3,
        riskGoal: 1,
        consistencyGoal: 80,
        status: "active",
        createdAt: new Date().toISOString()
      });

      // Add a psychology mood check
      const psychRef = doc(collection(db, "psychology"));
      batch.set(psychRef, {
        userId: user.uid,
        date: new Date().toISOString().split("T")[0],
        mood: ["Disciplined", "Confident"],
        sleepHours: 8,
        stressLevel: 2,
        focusLevel: 4,
        energyLevel: 4,
        notes: "Markets were orderly. Feeling calm and structured today.",
        patternsDetected: "No major errors detected. Clean execution of rules.",
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      await fetchTrades();
    } catch (e) {
      console.error("Error committing batch:", e);
    } finally {
      setDemoLoading(false);
    }
  };

  const metrics = calculateMetrics(trades, initialEquity);

  // Recharts Equity Curve Data Preparation
  const chartData = [{ name: "Start", equity: initialEquity }];
  let cumProfit = 0;
  const sortedTrades = [...trades]
    .filter((t) => t.status !== "Open")
    .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime());

  sortedTrades.forEach((t) => {
    cumProfit += calculateTradeProfit(t);
    chartData.push({
      name: t.date.slice(5), // MM-DD
      equity: initialEquity + cumProfit,
    });
  });

  // Calendar Performance Grid (net profit per day)
  const getCalendarDays = () => {
    const today = new Date();
    const days = [];
    const profitMap: Record<string, number> = {};

    trades.forEach((t) => {
      if (t.status !== "Open") {
        const profit = calculateTradeProfit(t);
        profitMap[t.date] = (profitMap[t.date] || 0) + profit;
      }
    });

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dateStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        profit: profitMap[dateStr] || 0,
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  // Recent 5 Trades list
  const recentTrades = [...trades]
    .sort((a, b) => new Date(`${b.date}T${b.time || "00:00"}`).getTime() - new Date(`${a.date}T${a.time || "00:00"}`).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="h-8 w-48 bg-gray-800 rounded-md"></div>
          <div className="h-10 w-32 bg-gray-800 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800/40 rounded-xl border border-gray-800/50"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-800/20 rounded-xl border border-gray-800/50"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {accountMode === "demo" && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-sm text-emerald-300 font-medium">
            Demo Account — All trades are simulated and stored separately from your real account.
          </p>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Trader Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {accountMode === "demo" ? "Demo account — practice trading without risking real money." : "Analyze your performance, track win streaks, and review your AI analytics."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrades}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-300 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Data
          </button>
          <Link
            href="/trade-entry"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Trade
          </Link>
        </div>
      </div>

      {trades.length === 0 ? (
        // Empty State with Premium demo generation helper
        <div className="flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-2xl p-12 text-center bg-[#070b18]/40">
          <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-200">No trading records found</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-2 mb-6">
            To view detailed metrics, equity curves, calendar distributions, and AI insights, please log your first trade or auto-populate realistic sample data.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/trade-entry"
              className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/15 transition-all cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Create Trade Entry
            </Link>
            <button
              onClick={handleGenerateDemoData}
              disabled={demoLoading}
              className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-gray-300 border border-gray-800 rounded-lg hover:bg-gray-800/80 transition-all cursor-pointer disabled:opacity-50"
            >
              {demoLoading ? "Creating..." : "Generate Demo Trades"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Profit */}
            <div className="glass-card p-4 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Net realized profit</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight">
                  ${metrics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className={`text-[10px] font-semibold mt-1 block ${metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {metrics.totalProfit >= 0 ? "Account positive" : "Drawdown state"}
              </span>
            </div>

            {/* Win Rate */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Win Rate</span>
                <Percent className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight">
                  {metrics.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${metrics.winRate}%` }}
                />
              </div>
            </div>

            {/* Profit Factor */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Profit Factor</span>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight">
                  {metrics.profitFactor === Infinity ? "N/A" : metrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <span className={`text-[10px] font-semibold mt-1 block ${metrics.profitFactor >= 1.5 ? 'text-emerald-500' : metrics.profitFactor >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                {metrics.profitFactor >= 1.5 ? "Very profitable" : metrics.profitFactor >= 1 ? "Breakeven zone" : "Unprofitable"}
              </span>
            </div>

            {/* Current Streak */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Current Streak</span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight">
                  {metrics.currentStreak > 0 ? `+${metrics.currentStreak} Wins` : metrics.currentStreak < 0 ? `${metrics.currentStreak} Losses` : "0 Trades"}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Best Win Streak: +{metrics.bestStreak}
              </span>
            </div>

            {/* Equity */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Current Equity</span>
                <Award className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="mt-2">
                <span className="text-lg md:text-xl font-bold">
                  ${metrics.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block mt-1">
                Start: ${initialEquity.toLocaleString()}
              </span>
            </div>

            {/* Average RR */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Average R:R</span>
                <Calculator className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-lg md:text-xl font-bold">
                  1:{metrics.averageRR.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block mt-1">
                Risk allocation efficiency
              </span>
            </div>

            {/* Largest Win / Loss */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Win / Loss Extreme</span>
                <AlertTriangle className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Win:</span>
                  <span className="font-semibold">+${metrics.largestWin.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-red-400">
                  <span>Loss:</span>
                  <span className="font-semibold">-${Math.abs(metrics.largestLoss).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Average Hold Time */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Avg Hold Time</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-2">
                <span className="text-lg md:text-xl font-bold">
                  {metrics.averageHoldingTime >= 60
                    ? `${(metrics.averageHoldingTime / 60).toFixed(1)} hrs`
                    : `${metrics.averageHoldingTime.toFixed(0)} mins`}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 block mt-1">
                Total duration average
              </span>
            </div>
          </div>

          {/* Tab Selector & Main Performance Area */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 mb-6 gap-4">
              <div className="flex items-center gap-1 bg-[#090e1f] p-1 rounded-lg border border-gray-800 flex-wrap">
                <button
                  onClick={() => setActiveTab("equity")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "equity"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Equity Curve
                </button>
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === "calendar"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setActiveTab("tradingview")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTab === "tradingview"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>📈</span> Pine Script
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-400">Wins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-gray-400">Losses</span>
                </div>
              </div>
            </div>

            {/* Equity Curve Graph */}
            {activeTab === "equity" && (
              <DashboardChart data={chartData} />
            )}

            {/* TradingView Pine Script Chart */}
            {activeTab === "tradingview" && (
              <TradingViewChart />
            )}

            {/* Trading Calendar Grid */}
            {activeTab === "calendar" && (
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-3">
                {calendarDays.map((day) => {
                  const hasTrade = day.profit !== 0;
                  const isGreen = day.profit > 0;
                  return (
                    <div
                      key={day.dateStr}
                      className={`p-3 rounded-lg border flex flex-col justify-between h-20 transition-all ${
                        hasTrade
                          ? isGreen
                            ? "bg-emerald-500/10 border-emerald-500/30 glow-green"
                            : "bg-red-500/10 border-red-500/30 glow-blue"
                          : "bg-gray-900/30 border-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          {day.dayName}
                        </span>
                        <span className="text-xs font-semibold text-gray-300">
                          {day.dayNum}
                        </span>
                      </div>
                      <div className="text-right">
                        {hasTrade ? (
                          <span className={`text-xs font-bold ${isGreen ? "text-emerald-400" : "text-red-400"}`}>
                            {isGreen ? "+" : ""}${day.profit.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-700">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lower Grid: Recent Trades & Quick Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Trades Table */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                <h3 className="text-sm font-bold text-gray-200">Recent Trading Activity</h3>
                <Link
                  href="/journal"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                >
                  View full journal <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Asset</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Direction</th>
                      <th className="py-2.5">Result</th>
                      <th className="py-2.5 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {recentTrades.map((t) => {
                      const profit = calculateTradeProfit(t);
                      const isWin = profit > 0;
                      return (
                        <tr key={t.id} className="hover:bg-gray-800/10 transition-colors">
                          <td className="py-3 text-gray-300">{t.date}</td>
                          <td className="py-3 font-semibold text-gray-200">{t.market}</td>
                          <td className="py-3 text-gray-400">{t.assetType}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.direction === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                            }`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === "Win" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
                              t.status === "Loss" ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                              "bg-gray-800 text-gray-300"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className={`py-3 text-right font-bold ${isWin ? "text-emerald-400" : profit < 0 ? "text-red-400" : "text-gray-400"}`}>
                            {t.status === "Open" ? "Open" : `${isWin ? "+" : ""}$${profit.toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Analytics Cards */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-3 mb-4">
                  Account Standing
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Gross realization:</span>
                    <span className="font-semibold text-gray-300">
                      ${cumProfit >= 0 ? `+${cumProfit.toFixed(0)}` : cumProfit.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total volume trades:</span>
                    <span className="font-semibold text-gray-300">{trades.length} entries</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Win ratio efficiency:</span>
                    <span className="font-semibold text-blue-400">{metrics.winRate.toFixed(0)}% accuracy</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Default settings risk:</span>
                    <span className="font-semibold text-emerald-400">{userSettings?.brokerSettings?.defaultRiskPct || 1}% / trade</span>
                  </div>
                </div>
              </div>

              {/* AI Coaching Tips widget */}
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-900/10 to-emerald-950/10 border-blue-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4.5 w-4.5 text-blue-400" />
                  <h4 className="text-sm font-bold text-gray-200">AI Coach Quick Tips</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {metrics.winRate > 60
                    ? "Great win rate! You are showing disciplined executions. Keep protecting your risk using proper stop losses."
                    : metrics.totalTrades > 2
                    ? "Your statistics suggest refining your entry zones. Go to the AI Coach chat tab to scan your mistakes."
                    : "Welcome to TradeSense! Run a few trades or click the demo button to activate the automated AI reviews."}
                </p>
                <Link
                  href="/ai-coach"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Consult AI Coach <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
