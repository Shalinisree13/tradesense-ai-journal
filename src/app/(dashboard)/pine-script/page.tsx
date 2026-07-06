"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  FileCode,
  FilePlus,
  FolderOpen,
  Save,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Terminal,
  Activity,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  Eye,
  Sun,
  Moon,
  Search,
} from "lucide-react";

interface Script {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_SCRIPTS: Script[] = [
  {
    id: "trend-follower",
    name: "EMA Cross Strategy",
    code: `//@version=5
strategy("EMA Cross Trend Follower", overlay=true)

// --- Inputs ---
fastEMA = input.int(9, "Fast EMA Length")
slowEMA = input.int(21, "Slow EMA Length")
riskPct = input.float(1.0, "Risk Per Trade %")

// --- Calculations ---
ema9 = ta.ema(close, fastEMA)
ema21 = ta.ema(close, slowEMA)

buySignal = ta.crossover(ema9, ema21)
sellSignal = ta.crossunder(ema9, ema21)

// --- Plots ---
plot(ema9, "Fast EMA", color=color.blue)
plot(ema21, "Slow EMA", color=color.orange)

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
rsiLen = input.int(14, "RSI Length")
overbought = input.int(70, "Overbought Level")
oversold = input.int(30, "Oversold Level")

// --- Calculations ---
rsiVal = ta.rsi(close, rsiLen)

buySignal = ta.crossover(rsiVal, oversold)
sellSignal = ta.crossunder(rsiVal, overbought)

// --- Strategy Execution ---
if (buySignal)
    strategy.entry("RSI Long", strategy.long)

if (sellSignal)
    strategy.close("RSI Long")
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
  const [showSearch, setShowSearch] = useState<boolean>(false);
  
  // Console state
  const [logs, setLogs] = useState<{ type: "info" | "success" | "warning" | "error"; text: string; time: string }[]>([
    { type: "info", text: "Pine Editor Workspace ready. Select a script or click Compile to begin.", time: new Date().toLocaleTimeString() },
  ]);

  // Backtest result state
  const [backtestResult, setBacktestResult] = useState<{
    netProfit: string;
    profitFactor: string;
    winRate: string;
    totalTrades: number;
    signals: { type: "BUY" | "SELL"; price: string; date: string; profit?: string }[];
  } | null>(null);

  const activeScript = scripts.find((s) => s.id === activeTab) || scripts[0];

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

  const handleCompile = () => {
    addLog("info", `Compiling script ${activeScript.name}...`);
    
    // Simulate compilation steps
    setTimeout(() => {
      if (activeScript.code.includes("error") || activeScript.code.trim() === "") {
        addLog("error", "Line 12: Script contains structural compile syntax errors.");
        addLog("error", "Compilation failed.");
        setBacktestResult(null);
      } else {
        addLog("warning", "Line 8: Variable shadowing detected. Using default overrides.");
        addLog("success", "Script compiled successfully! Generated live trading logic.");
        
        // Populate simulated backtesting result
        setBacktestResult({
          netProfit: "+12.45%",
          profitFactor: "1.84",
          winRate: "58.3%",
          totalTrades: 24,
          signals: [
            { type: "BUY", price: "$68,450.00", date: "2026-07-06 10:14", profit: "+1.2%" },
            { type: "SELL", price: "$69,210.00", date: "2026-07-06 11:02", profit: "+0.8%" },
            { type: "BUY", price: "$68,900.00", date: "2026-07-06 11:45", profit: "-0.4%" },
            { type: "SELL", price: "$69,150.00", date: "2026-07-06 12:05", profit: "+0.36%" },
          ],
        });
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Pine Script™ Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Build, test, compile, and run your custom indicators & automated strategy pipelines.
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
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  <Play className="h-3 w-3 animate-pulse" /> Compile & Run
                </button>
              </div>
            </div>

            <div className="flex font-mono text-xs leading-relaxed" style={{ minHeight: "380px" }}>
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
                className="flex-1 p-4 bg-transparent resize-none outline-none border-none min-h-[380px] font-mono focus:ring-0 focus:outline-none"
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
              <div className="p-4 bg-gray-950/70 font-mono text-[11px] space-y-2 max-h-[160px] overflow-y-auto">
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

        {/* Right Column: Strategy Backtest & Output */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <Activity className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Strategy Backtesting</h2>
            </div>

            {!backtestResult ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
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
