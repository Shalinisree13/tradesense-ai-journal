"use client";

import React, { useEffect, useRef, useState } from "react";
import { Code2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
}

const DEFAULT_PINE_SCRIPT = `//@version=5
indicator("TradeSense AI — Trade Overlay", overlay=true)

// ─── Inputs ───────────────────────────────────────
showEMA = input.bool(true, "Show EMA 20/50")
showBB  = input.bool(true, "Show Bollinger Bands")
rsiLen  = input.int(14, "RSI Length", minval=1)

// ─── EMA ──────────────────────────────────────────
ema20 = ta.ema(close, 20)
ema50 = ta.ema(close, 50)

plot(showEMA ? ema20 : na, "EMA 20", color=color.new(color.blue, 0), linewidth=2)
plot(showEMA ? ema50 : na, "EMA 50", color=color.new(color.orange, 0), linewidth=2)

// ─── Bollinger Bands ──────────────────────────────
[bbMid, bbUpper, bbLower] = ta.bb(close, 20, 2)
plot(showBB ? bbUpper : na, "BB Upper", color=color.new(color.gray, 50))
plot(showBB ? bbMid   : na, "BB Mid",   color=color.new(color.gray, 30))
plot(showBB ? bbLower : na, "BB Lower", color=color.new(color.gray, 50))
fill(plot(bbUpper), plot(bbLower), color=color.new(color.gray, 90))

// ─── RSI Signal ───────────────────────────────────
rsi = ta.rsi(close, rsiLen)
isOverbought = rsi > 70
isOversold   = rsi < 30

plotshape(isOverbought, "Overbought", shape.labeldown, location.abovebar, color.red,   text="OB", textcolor=color.white, size=size.tiny)
plotshape(isOversold,   "Oversold",   shape.labelup,   location.belowbar,  color.green, text="OS", textcolor=color.white, size=size.tiny)

// ─── Background ───────────────────────────────────
bgcolor(isOverbought ? color.new(color.red,   92) : na)
bgcolor(isOversold   ? color.new(color.green, 92) : na)
`;

export default function TradingViewChart({ symbol = "NASDAQ:AAPL", interval = "D" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [pineScript, setPineScript] = useState(DEFAULT_PINE_SCRIPT);
  const [copied, setCopied] = useState(false);
  const [chartSymbol, setChartSymbol] = useState(symbol);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!(window as any).TradingView || !containerRef.current) return;
      widgetRef.current = new (window as any).TradingView.widget({
        autosize: true,
        symbol: chartSymbol,
        interval: interval,
        timezone: "Asia/Kolkata",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#070b18",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: "tv_chart_container",
        backgroundColor: "rgba(7, 11, 24, 1)",
        gridColor: "rgba(255, 255, 255, 0.03)",
        studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies", "BB@tv-basicstudies"],
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates"],
      });
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [chartSymbol, interval]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pineScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const popularSymbols = [
    { label: "AAPL", value: "NASDAQ:AAPL" },
    { label: "BTC", value: "BINANCE:BTCUSDT" },
    { label: "NIFTY", value: "NSE:NIFTY" },
    { label: "EUR/USD", value: "FX:EURUSD" },
    { label: "GOLD", value: "TVC:GOLD" },
    { label: "TSLA", value: "NASDAQ:TSLA" },
  ];

  return (
    <div className="space-y-3">
      {/* Symbol quick-select */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Quick switch:</span>
        {popularSymbols.map((s) => (
          <button
            key={s.value}
            onClick={() => setChartSymbol(s.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              chartSymbol === s.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* TradingView Chart */}
      <div className="rounded-xl overflow-hidden border border-gray-800/60" style={{ height: 480 }}>
        <div id="tv_chart_container" ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Pine Script Panel */}
      <div className="glass-card rounded-xl border border-gray-800/60 overflow-hidden">
        <button
          onClick={() => setScriptOpen(!scriptOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-gray-200">Pine Script™ — Trade Overlay</span>
            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded">v5</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{scriptOpen ? "Hide" : "View script"}</span>
            {scriptOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>

        {scriptOpen && (
          <div className="border-t border-gray-800">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0a0f1e] border-b border-gray-800">
              <span className="text-[11px] text-gray-500 font-mono">indicator.pine</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  ) : (
                    <><Copy className="h-3 w-3" /><span>Copy</span></>
                  )}
                </button>
                <a
                  href="https://www.tradingview.com/pine-script-docs/en/v5/Introduction.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Pine Script Docs ↗
                </a>
              </div>
            </div>

            {/* Code editor */}
            <textarea
              value={pineScript}
              onChange={(e) => setPineScript(e.target.value)}
              spellCheck={false}
              className="w-full bg-[#0d1117] text-emerald-300 font-mono text-xs p-4 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              style={{
                height: 320,
                lineHeight: "1.6",
                tabSize: 4,
                fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
              }}
            />

            <div className="px-4 py-2 bg-[#0a0f1e] border-t border-gray-800 flex items-center justify-between">
              <p className="text-[10px] text-gray-600">
                Edit the script above, then paste it into TradingView's Pine Script editor to apply it to your chart.
              </p>
              <a
                href="https://www.tradingview.com/chart/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Open in TradingView ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
