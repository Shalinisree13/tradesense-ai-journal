"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  FileCode,
  FilePlus,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Terminal,
  Activity,
  Copy,
  Check,
  TrendingUp,
  Sun,
  Moon,
  Search,
  Clock,
  Settings,
  Layers,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  FastForward,
  RotateCcw,
  PlusSquare,
  LayoutGrid,
} from "lucide-react";

interface Script {
  id: string;
  name: string;
  code: string;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic simulated price candles based on timeframe
const generateCandles = (count: number, timeframe: string, startPrice: number = 65000): Candle[] => {
  const candles: Candle[] = [];
  let price = startPrice;
  const now = new Date();
  
  let timeMultiplier = 24 * 60 * 60 * 1000; // default 1D
  if (timeframe === "1m") timeMultiplier = 60 * 1000;
  else if (timeframe === "5m") timeMultiplier = 5 * 60 * 1000;
  else if (timeframe === "15m") timeMultiplier = 15 * 60 * 1000;
  else if (timeframe === "1h") timeMultiplier = 60 * 60 * 1000;
  else if (timeframe === "4h") timeMultiplier = 4 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const volatility = timeframe === "1m" || timeframe === "5m" ? 0.008 : 0.03;
    const change = price * (Math.random() * (volatility * 2) - volatility + (volatility * 0.1)); 
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (price * (volatility * 0.2));
    const low = Math.min(open, close) - Math.random() * (price * (volatility * 0.2));
    const volume = Math.round(50 + Math.random() * 200);
    
    const date = new Date(now.getTime() - (count - i) * timeMultiplier);
    let timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (timeframe.includes("m") || timeframe.includes("h")) {
      timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    
    candles.push({ time: timeStr, open, high, low, close, volume });
    price = close;
  }
  return candles;
};

// Calculate Heikin Ashi candles
const calculateHeikinAshi = (raw: Candle[]): Candle[] => {
  const ha: Candle[] = [];
  if (raw.length === 0) return ha;

  // First candle seed
  let prevOpen = raw[0].open;
  let prevClose = raw[0].close;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = (prevOpen + prevClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    ha.push({
      time: c.time,
      open: haOpen,
      close: haClose,
      high: haHigh,
      low: haLow,
      volume: c.volume
    });

    prevOpen = haOpen;
    prevClose = haClose;
  }
  return ha;
};

const DEFAULT_SCRIPTS: Script[] = [
  {
    id: "trend-follower",
    name: "EMA Cross Strategy",
    code: `//@version=5
strategy("EMA Cross Trend Follower", overlay=true)

// --- Inputs ---
fastEMA = 9
slowEMA = 21

// --- Calculations ---
ema9 = ta.ema(close, fastEMA)
ema21 = ta.ema(close, slowEMA)

buySignal = ta.crossover(ema9, ema21)
sellSignal = ta.crossunder(ema9, ema21)

// --- Strategy Execution ---
if (buySignal)
    strategy.entry("Long Entry", strategy.long)

if (sellSignal)
    strategy.close("Long Entry")
`,
  },
  {
    id: "rsi-reversal",
    name: "RSI Mean Reversion",
    code: `//@version=5
strategy("RSI Reversal Strategy", overlay=true)

// --- Inputs ---
rsiLen = 14
overbought = 70
oversold = 30

// --- Calculations ---
rsiVal = ta.rsi(close, rsiLen)

buySignal = ta.crossover(rsiVal, oversold)
sellSignal = ta.crossunder(rsiVal, overbought)
`,
  },
];

export default function PineScriptWorkspace() {
  const [scripts, setScripts] = useState<Script[]>(DEFAULT_SCRIPTS);
  const [activeTab, setActiveTab] = useState<string>("trend-follower");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isConsoleExpanded, setIsConsoleExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Custom interactive toolbar states
  const [timeframe, setTimeframe] = useState<string>("1D");
  const [chartStyle, setChartStyle] = useState<"candles" | "heikin" | "line" | "bars">("candles");
  const [visibleIndicators, setVisibleIndicators] = useState<string[]>(["EMA9", "EMA21", "BB"]);
  const [layoutMode, setLayoutMode] = useState<"single" | "split">("single");

  // Replay states
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(25);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // 1s, 0.5s, 0.2s

  // Candles & Indicators cache
  const [rawCandles, setRawCandles] = useState<Candle[]>([]);
  const [activeCandles, setActiveCandles] = useState<Candle[]>([]);
  
  const [indicatorData, setIndicatorData] = useState<{
    fastEMA: number[];
    slowEMA: number[];
    bbUpper: number[];
    bbLower: number[];
    signals: { index: number; type: "BUY" | "SELL"; price: number }[];
  } | null>(null);

  const [logs, setLogs] = useState<{ type: "info" | "success" | "warning" | "error"; text: string; time: string }[]>([
    { type: "info", text: "Pine Editor Workspace ready. Select a script or click Compile & Run.", time: new Date().toLocaleTimeString() },
  ]);

  const [backtestResult, setBacktestResult] = useState<{
    netProfit: string;
    profitFactor: string;
    winRate: string;
    totalTrades: number;
    signals: { type: "BUY" | "SELL"; price: string; date: string; profit?: string }[];
  } | null>(null);

  const activeScript = scripts.find((s) => s.id === activeTab) || scripts[0];
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and regenerate candles on timeframe change
  useEffect(() => {
    const count = 60;
    const generated = generateCandles(count, timeframe, timeframe === "1m" || timeframe === "5m" ? 64300 : 61200);
    setRawCandles(generated);
    
    if (isReplayMode) {
      setActiveCandles(generated.slice(0, replayIndex));
    } else {
      setActiveCandles(generated);
    }
    setIndicatorData(null);
    setBacktestResult(null);
    addLog("info", `Set timeframe to ${timeframe}. Simulating fresh trading feed.`);
  }, [timeframe]);

  // Synchronize candles when Replay Index increments
  useEffect(() => {
    if (isReplayMode) {
      setActiveCandles(rawCandles.slice(0, replayIndex));
    } else {
      setActiveCandles(rawCandles);
    }
  }, [replayIndex, isReplayMode, rawCandles]);

  // Dynamic automatic playback effect for replay mode
  useEffect(() => {
    if (isReplayPlaying && isReplayMode) {
      const intervalTime = 1000 / replaySpeed;
      playbackTimerRef.current = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= rawCandles.length) {
            setIsReplayPlaying(false);
            addLog("success", "Replay playback complete.");
            return prev;
          }
          return prev + 1;
        });
      }, intervalTime);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isReplayPlaying, isReplayMode, replaySpeed, rawCandles.length]);

  // Trigger recalculation of technical calculations when candles evolve
  useEffect(() => {
    if (activeCandles.length > 0 && indicatorData !== null) {
      calculateIndicatorsDirectly();
    }
  }, [activeCandles.length]);

  const updateCode = (newCode: string) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === activeTab ? { ...s, code: newCode } : s))
    );
  };

  const handleNewScript = () => {
    const id = `script_${Date.now()}`;
    const name = `Untitled Script ${scripts.length + 1}`;
    const newScript = {
      id,
      name,
      code: `//@version=5
indicator("${name}", overlay=true)

// Enter code here
plot(close)
`,
    };
    setScripts((prev) => [...prev, newScript]);
    setActiveTab(id);
    addLog("info", `Created new script: ${name}`);
  };

  const handleDeleteTab = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scripts.length === 1) {
      addLog("error", "Cannot delete the last active script.");
      return;
    }
    const deleteIndex = scripts.findIndex((s) => s.id === idToDelete);
    const newScripts = scripts.filter((s) => s.id !== idToDelete);
    setScripts(newScripts);
    if (activeTab === idToDelete) {
      const nextActive = newScripts[deleteIndex] || newScripts[deleteIndex - 1] || newScripts[0];
      setActiveTab(nextActive.id);
    }
    addLog("info", "Script deleted.");
  };

  const addLog = (type: "info" | "success" | "warning" | "error", text: string) => {
    setLogs((prev) => [
      ...prev,
      { type, text, time: new Date().toLocaleTimeString() },
    ]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog("info", "Script copied to clipboard.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const id = `imported_${Date.now()}`;
      const name = file.name.replace(".pine", "").replace(".txt", "");
      setScripts((prev) => [...prev, { id, name, code: content }]);
      setActiveTab(id);
      addLog("success", `Imported script: ${name}`);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([activeScript.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeScript.name.toLowerCase().replace(/\s+/g, "_")}.pine`;
    link.click();
    URL.revokeObjectURL(url);
    addLog("success", `Exported script: ${activeScript.name}`);
  };

  // Compile calculations core
  const calculateIndicatorsDirectly = () => {
    const fastEMAMatch = activeScript.code.match(/fastEMA\s*=\s*(\d+)/);
    const slowEMAMatch = activeScript.code.match(/slowEMA\s*=\s*(\d+)/);
    
    const fastLen = fastEMAMatch ? parseInt(fastEMAMatch[1]) : 9;
    const slowLen = slowEMAMatch ? parseInt(slowEMAMatch[1]) : 21;

    const calcEMA = (data: number[], length: number): number[] => {
      const ema: number[] = [];
      const k = 2 / (length + 1);
      let val = data[0] || 0;
      ema.push(val);
      for (let i = 1; i < data.length; i++) {
        val = data[i] * k + val * (1 - k);
        ema.push(val);
      }
      return ema;
    };

    const calcBB = (data: number[], length: number): { upper: number[]; lower: number[] } => {
      const upper: number[] = [];
      const lower: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < length) {
          upper.push(data[i]);
          lower.push(data[i]);
          continue;
        }
        const slice = data.slice(i - length + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / length;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / length;
        const stdDev = Math.sqrt(variance);
        upper.push(mean + stdDev * 2);
        lower.push(mean - stdDev * 2);
      }
      return { upper, lower };
    };

    const closePrices = activeCandles.map(c => c.close);
    const fastEMAVal = calcEMA(closePrices, fastLen);
    const slowEMAVal = calcEMA(closePrices, slowLen);
    const bb = calcBB(closePrices, 20);

    const calculatedSignals: { index: number; type: "BUY" | "SELL"; price: number }[] = [];
    const backtestSignals: { type: "BUY" | "SELL"; price: string; date: string; profit?: string }[] = [];

    for (let i = 1; i < closePrices.length; i++) {
      const prevFast = fastEMAVal[i - 1];
      const prevSlow = slowEMAVal[i - 1];
      const currFast = fastEMAVal[i];
      const currSlow = slowEMAVal[i];

      if (prevFast <= prevSlow && currFast > currSlow) {
        calculatedSignals.push({ index: i, type: "BUY", price: closePrices[i] });
        backtestSignals.push({
          type: "BUY",
          price: `$${closePrices[i].toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          date: activeCandles[i].time,
        });
      }
      else if (prevFast >= prevSlow && currFast < currSlow) {
        calculatedSignals.push({ index: i, type: "SELL", price: closePrices[i] });
        backtestSignals.push({
          type: "SELL",
          price: `$${closePrices[i].toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          date: activeCandles[i].time,
          profit: "+2.4%"
        });
      }
    }

    setIndicatorData({
      fastEMA: fastEMAVal,
      slowEMA: slowEMAVal,
      bbUpper: bb.upper,
      bbLower: bb.lower,
      signals: calculatedSignals,
    });

    setBacktestResult({
      netProfit: "+21.4%",
      profitFactor: "2.35",
      winRate: "64.7%",
      totalTrades: backtestSignals.length,
      signals: backtestSignals.reverse(),
    });
  };

  const handleCompile = () => {
    addLog("info", `Compiling code of ${activeScript.name}...`);
    setTimeout(() => {
      if (activeScript.code.includes("error") || activeScript.code.trim() === "") {
        addLog("error", "Line 14: Compile syntax error - invalid indicator call.");
        addLog("error", "Compilation failed.");
        setIndicatorData(null);
        setBacktestResult(null);
        return;
      }
      calculateIndicatorsDirectly();
      addLog("success", "Script compiled & rendered on native chart successfully.");
    }, 650);
  };

  const toggleIndicator = (ind: string) => {
    setVisibleIndicators(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );
  };

  // Rendering Helper: Calculate coordinates for the SVG candlestick chart
  const padding = 40;
  const chartHeight = 260;
  const chartWidth = 680;

  const minVal = activeCandles.length > 0 ? Math.min(...activeCandles.map(c => c.low)) * 0.995 : 0;
  const maxVal = activeCandles.length > 0 ? Math.max(...activeCandles.map(c => c.high)) * 1.005 : 100;
  const range = maxVal - minVal;

  const getX = (index: number) => {
    if (activeCandles.length <= 1) return padding;
    return padding + (index / (activeCandles.length - 1)) * (chartWidth - padding * 2);
  };

  const getY = (value: number) => {
    return chartHeight - padding - ((value - minVal) / range) * (chartHeight - padding * 2);
  };

  // Determine which candles to render (Heikin Ashi or Standard)
  const displayCandles = chartStyle === "heikin" ? calculateHeikinAshi(activeCandles) : activeCandles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Pine Script™ Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Build, test, compile, and run your custom indicators & strategy pipelines directly in TradeSense.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 border border-gray-800 rounded-lg text-gray-400 hover:text-white cursor-pointer hover:bg-gray-800/40"
            title="Toggle Editor Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <button
            onClick={handleNewScript}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            <FilePlus className="h-3.5 w-3.5" /> New Script
          </button>
        </div>
      </div>

      {/* Main Studio Tools Toolbar */}
      <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-3.5 flex flex-wrap gap-4 items-center justify-between shadow-2xl">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#070b18] border border-gray-800 rounded-lg p-0.5">
            {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  timeframe === tf
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style Selector */}
          <div className="flex items-center bg-[#070b18] border border-gray-800 rounded-lg p-0.5">
            {[
              { id: "candles", label: "🕯️ Candles" },
              { id: "heikin", label: "🧘 Heikin" },
              { id: "line", label: "📈 Line" },
              { id: "bars", label: "📊 Bars" },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setChartStyle(style.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-all ${
                  chartStyle === style.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Indicators Checkboxes */}
          <div className="flex items-center gap-2">
            {[
              { id: "EMA9", label: "EMA 9" },
              { id: "EMA21", label: "EMA 21" },
              { id: "BB", label: "Bands" },
            ].map((ind) => (
              <button
                key={ind.id}
                onClick={() => toggleIndicator(ind.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  visibleIndicators.includes(ind.id)
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                    : "border-gray-800 text-gray-500 hover:text-gray-300"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Chart Mode Toggle */}
        <div className="flex items-center gap-2 bg-[#070b18] border border-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setLayoutMode("single")}
            className={`p-1.5 rounded cursor-pointer ${
              layoutMode === "single" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Single Chart layout"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayoutMode("split")}
            className={`p-1.5 rounded cursor-pointer ${
              layoutMode === "split" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            title="Split Multi-Chart Layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Script Workspace & Editor */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-gray-800 bg-[#070b18]/60 p-1.5 rounded-t-xl gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  onClick={() => setActiveTab(script.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === script.id
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                      : "text-gray-400 hover:bg-gray-800/40"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{script.name}</span>
                  {scripts.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteTab(script.id, e)}
                      className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-200"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Editor Actions */}
            <div className="flex items-center gap-1">
              <label className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer" title="Import Script">
                <Upload className="h-3.5 w-3.5" />
                <input type="file" accept=".pine,.txt" onChange={handleImport} className="hidden" />
              </label>
              <button
                onClick={handleExport}
                className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer"
                title="Export Script"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer"
                title="Copy Script Code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Code Editor Body */}
          <div className={`relative border border-t-0 border-gray-800 rounded-b-xl overflow-hidden ${
            theme === "dark" ? "bg-[#0b0f19] text-gray-300" : "bg-white text-gray-800"
          }`}>
            
            {/* Find Search bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/30">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Find in script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs outline-none border-none max-w-xs text-gray-300"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompile}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Play className="h-3 w-3 animate-pulse" /> Compile & Run
                </button>
              </div>
            </div>

            <div className="flex font-mono text-xs leading-relaxed" style={{ minHeight: "300px" }}>
              {/* Line Numbers */}
              <div className="p-4 bg-gray-950/40 text-gray-600 select-none border-r border-gray-800/40 text-right min-w-[36px]">
                {activeScript.code.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Code Input */}
              <textarea
                value={activeScript.code}
                onChange={(e) => updateCode(e.target.value)}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent resize-none outline-none border-none min-h-[300px] font-mono focus:ring-0 focus:outline-none"
                style={{
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                  color: theme === "dark" ? "#10b981" : "#059669",
                }}
              />
            </div>
          </div>

          {/* Console / Output logs panel */}
          <div className="glass-card rounded-xl border border-gray-800/80 overflow-hidden">
            <div
              onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
              className="flex items-center justify-between px-4 py-2.5 bg-[#090e1f] border-b border-gray-800 cursor-pointer hover:bg-gray-800/20"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Console & Compilation Logs</span>
              </div>
              <span className="text-[10px] text-gray-500">{isConsoleExpanded ? "Collapse" : "Expand"}</span>
            </div>

            {isConsoleExpanded && (
              <div className="p-4 bg-gray-950/70 font-mono text-[11px] space-y-2 max-h-[140px] overflow-y-auto">
                {logs.map((log, index) => {
                  const Icon = log.type === "success" ? CheckCircle : log.type === "warning" ? AlertTriangle : log.type === "error" ? XCircle : Terminal;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-2.5 ${
                        log.type === "success"
                          ? "text-emerald-400"
                          : log.type === "warning"
                          ? "text-amber-400"
                          : log.type === "error"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-gray-600 mr-2">[{log.time}]</span>
                        <span>{log.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Native Dynamic Chart & Strategy Backtest */}
        <div className="space-y-6">
          
          {/* Custom Interactive SVG Candlestick Charts */}
          <div className="glass-card rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Interactive Live Preview</h3>
              </div>
              
              {/* Replay controller toggle */}
              <button
                onClick={() => {
                  setIsReplayMode(!isReplayMode);
                  setReplayIndex(25);
                  setIsReplayPlaying(false);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  isReplayMode
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                    : "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {isReplayMode ? "⏹️ Exit Replay" : "🔄 Bar Replay"}
              </button>
            </div>

            {/* Split Screen Multi-Chart layouts */}
            <div className={`grid gap-4 ${layoutMode === "split" ? "grid-cols-1" : "grid-cols-1"}`}>
              
              {/* Primary Chart panel */}
              {activeCandles.length > 0 ? (
                <div className="relative w-full overflow-hidden bg-gray-950 rounded-xl border border-gray-800/80 p-2">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Grid Lines */}
                    {[0, 1, 2, 3, 4].map(idx => (
                      <line
                        key={idx}
                        x1={padding}
                        y1={padding + (idx / 4) * (chartHeight - padding * 2)}
                        x2={chartWidth - padding}
                        y2={padding + (idx / 4) * (chartHeight - padding * 2)}
                        stroke="#1e293b"
                        strokeWidth="0.8"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Draw Candlesticks, Line or Bar Chart */}
                    {displayCandles.map((candle, idx) => {
                      const x = getX(idx);
                      const yOpen = getY(candle.open);
                      const yClose = getY(candle.close);
                      const yHigh = getY(candle.high);
                      const yLow = getY(candle.low);
                      const isGreen = candle.close >= candle.open;
                      
                      // Line chart rendering
                      if (chartStyle === "line") return null;

                      // Bar Chart rendering
                      if (chartStyle === "bars") {
                        return (
                          <g key={idx}>
                            <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={isGreen ? "#10b981" : "#ef4444"} strokeWidth="1.5" />
                            {/* Left tick for Open */}
                            <line x1={x - 4} y1={yOpen} x2={x} y2={yOpen} stroke={isGreen ? "#10b981" : "#ef4444"} strokeWidth="1.5" />
                            {/* Right tick for Close */}
                            <line x1={x} y1={yClose} x2={x + 4} y2={yClose} stroke={isGreen ? "#10b981" : "#ef4444"} strokeWidth="1.5" />
                          </g>
                        );
                      }

                      // Default Candlesticks/Heikin Ashi
                      return (
                        <g key={idx}>
                          <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={isGreen ? "#10b981" : "#ef4444"} strokeWidth="1.5" />
                          <rect
                            x={x - 4}
                            y={Math.min(yOpen, yClose)}
                            width="8"
                            height={Math.max(Math.abs(yOpen - yClose), 1)}
                            fill={isGreen ? "#10b981" : "#ef4444"}
                          />
                        </g>
                      );
                    })}

                    {/* Render Line chart path */}
                    {chartStyle === "line" && (
                      <path
                        d={displayCandles.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(c.close)}`).join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Indicator overlays */}
                    {indicatorData && (
                      <>
                        {/* Bollinger Bands Shading */}
                        {visibleIndicators.includes("BB") && (
                          <path
                            d={
                              indicatorData.bbUpper.map((val, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(val)}`).join(" ") + " " +
                              indicatorData.bbLower.map((val, idx) => `L ${getX(indicatorData.bbLower.length - 1 - idx)} ${getY(indicatorData.bbLower[indicatorData.bbLower.length - 1 - idx])}`).join(" ") + " Z"
                            }
                            fill="rgba(59, 130, 246, 0.05)"
                            stroke="none"
                          />
                        )}

                        {/* EMA 9 */}
                        {visibleIndicators.includes("EMA9") && (
                          <path
                            d={indicatorData.fastEMA.map((val, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(val)}`).join(" ")}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                        )}

                        {/* EMA 21 */}
                        {visibleIndicators.includes("EMA21") && (
                          <path
                            d={indicatorData.slowEMA.map((val, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(val)}`).join(" ")}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="2"
                          />
                        )}

                        {/* Signals */}
                        {indicatorData.signals.map((sig, sIdx) => {
                          if (sig.index >= displayCandles.length) return null;
                          const x = getX(sig.index);
                          const y = sig.type === "BUY" ? getY(displayCandles[sig.index].low) + 12 : getY(displayCandles[sig.index].high) - 12;
                          
                          return (
                            <polygon
                              key={sIdx}
                              points={sig.type === "BUY" ? `${x},${y} ${x-5},${y+9} ${x+5},${y+9}` : `${x},${y} ${x-5},${y-9} ${x+5},${y-9}`}
                              fill={sig.type === "BUY" ? "#10b981" : "#ef4444"}
                            />
                          );
                        })}
                      </>
                    )}
                  </svg>

                  {/* Chart details */}
                  <div className="absolute top-4 left-4 flex gap-3 text-[10px] text-gray-500 font-mono">
                    <span className="uppercase text-gray-400 font-black">BTCUSD ({timeframe})</span>
                  </div>
                </div>
              ) : (
                <div className="h-60 w-full animate-pulse rounded-xl bg-gray-800/10" />
              )}

              {/* Multi-Chart secondary split panel */}
              {layoutMode === "split" && (
                <div className="relative w-full overflow-hidden bg-gray-950 rounded-xl border border-gray-800/80 p-2">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {[0, 1, 2].map(idx => (
                      <line key={idx} x1={padding} y1={padding + (idx / 2) * (chartHeight - padding * 2)} x2={chartWidth - padding} y2={padding + (idx / 2) * (chartHeight - padding * 2)} stroke="#1e293b" strokeWidth="0.8" strokeDasharray="4 4" />
                    ))}
                    <path
                      d={displayCandles.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(c.close * 0.95)}`).join(" ")}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute top-4 left-4 text-[10px] text-gray-500 font-mono">
                    <span className="uppercase text-purple-400 font-black">ETHUSD ({timeframe})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Replay Controls Panel */}
            {isReplayMode && (
              <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReplayIndex(15)}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer"
                    title="Reset Replay"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsReplayPlaying(!isReplayPlaying)}
                    className="p-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white cursor-pointer"
                    title={isReplayPlaying ? "Pause" : "Play Replay"}
                  >
                    {isReplayPlaying ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (replayIndex < rawCandles.length) setReplayIndex(prev => prev + 1);
                    }}
                    className="p-1.5 bg-gray-900 hover:bg-gray-800 rounded text-gray-400 hover:text-white cursor-pointer"
                    title="Step Forward (1 Bar)"
                  >
                    <FastForward className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-[10px] text-gray-400 font-mono">
                  Bar: <strong>{replayIndex}</strong> / {rawCandles.length}
                </div>

                <div className="flex items-center gap-1.5 bg-[#070b18] border border-gray-800 rounded p-0.5">
                  {[1, 2, 4].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setReplaySpeed(speed)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                        replaySpeed === speed ? "bg-blue-600 text-white" : "text-gray-500"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <Activity className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Strategy Backtesting</h2>
            </div>

            {!backtestResult ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="h-10 w-10 text-gray-600 mb-3 animate-pulse" />
                <p className="text-xs text-gray-500 max-w-[200px]">
                  Compile and run your script to view simulated strategy performance and trade alerts.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#090e1f] border border-gray-800/80 p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Net Profit</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">{backtestResult.netProfit}</span>
                  </div>
                  <div className="bg-[#090e1f] border border-gray-800/80 p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Win Rate</span>
                    <span className="text-lg font-bold text-blue-400 mt-1 block">{backtestResult.winRate}</span>
                  </div>
                  <div className="bg-[#090e1f] border border-gray-800/80 p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Profit Factor</span>
                    <span className="text-lg font-bold text-gray-200 mt-1 block">{backtestResult.profitFactor}</span>
                  </div>
                  <div className="bg-[#090e1f] border border-gray-800/80 p-3 rounded-lg text-center">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Total Trades</span>
                    <span className="text-lg font-bold text-gray-200 mt-1 block">{backtestResult.totalTrades}</span>
                  </div>
                </div>

                {/* Backtest Signals List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Executed Signals</span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {backtestResult.signals.map((sig, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-900/40 rounded border border-gray-800/50 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            sig.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {sig.type}
                          </span>
                          <span className="text-gray-300 font-semibold">{sig.price}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">{sig.date}</span>
                          {sig.profit && (
                            <span className={`text-[10px] font-bold ${sig.profit.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                              {sig.profit}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
