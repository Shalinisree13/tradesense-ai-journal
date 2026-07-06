"use client";

import React, { useState } from "react";
import { Check, Crown, Zap, Star, Rocket, X } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    icon: Star,
    color: "gray",
    gradient: "from-gray-600 to-gray-700",
    borderColor: "border-gray-700/50",
    badgeColor: "bg-gray-800 text-gray-300",
    ctaClass: "bg-gray-800 hover:bg-gray-700 text-gray-200",
    features: [
      "Up to 50 trades",
      "Basic analytics dashboard",
      "Trade journal",
      "Manual trade entry",
      "Basic performance metrics",
      "Mobile responsive",
    ],
    missing: [
      "AI analysis",
      "Pine Script charts",
      "Advanced analytics",
      "Demo account",
      "Priority support",
    ],
    popular: false,
  },
  {
    name: "Basic",
    price: { monthly: 299, yearly: 249 },
    icon: Zap,
    color: "blue",
    gradient: "from-blue-600 to-blue-700",
    borderColor: "border-blue-700/40",
    badgeColor: "bg-blue-500/10 text-blue-400",
    ctaClass: "bg-blue-600 hover:bg-blue-500 text-white",
    features: [
      "Unlimited trades",
      "Performance dashboard",
      "Full trade journal",
      "Basic analytics",
      "Psychology tracker",
      "Goal tracking",
      "Watchlist (up to 20)",
      "Demo + Real account",
    ],
    missing: [
      "AI trade analysis",
      "Pine Script charts",
      "Advanced analytics",
      "Priority support",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 799, yearly: 599 },
    icon: Rocket,
    color: "purple",
    gradient: "from-violet-600 to-purple-700",
    borderColor: "border-violet-500/40",
    badgeColor: "bg-violet-500/10 text-violet-400",
    ctaClass: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white",
    features: [
      "Everything in Basic",
      "AI trade analysis (GPT-4)",
      "Pine Script chart view",
      "Advanced analytics",
      "Broker data import",
      "AI Coach (unlimited)",
      "Backtesting insights",
      "Risk management alerts",
      "Unlimited watchlist",
      "Export to PDF/CSV",
    ],
    missing: [
      "Portfolio tracking",
      "Custom strategy builder",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: { monthly: 1999, yearly: 1499 },
    icon: Crown,
    color: "yellow",
    gradient: "from-yellow-500 to-amber-600",
    borderColor: "border-yellow-500/40",
    badgeColor: "bg-yellow-500/10 text-yellow-400",
    ctaClass: "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold",
    features: [
      "Everything in Pro",
      "Portfolio tracking",
      "Custom strategy builder",
      "Pine Script editor",
      "Custom reports & analytics",
      "White-label journal",
      "Multi-account management",
      "API access",
      "Priority support (24/7)",
      "Early access to new features",
      "Dedicated account manager",
    ],
    missing: [],
    popular: false,
  },
];

export default function PremiumPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-semibold mb-4">
          <Crown className="h-3.5 w-3.5" />
          TradeSense AI Plans
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Choose Your{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
            Trading Edge
          </span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          From beginner traders to professional fund managers — TradeSense AI has a plan for every level.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-white" : "text-gray-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              billing === "yearly" ? "bg-emerald-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                billing === "yearly" ? "translate-x-6" : ""
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billing === "yearly" ? "text-white" : "text-gray-500"}`}>
            Yearly
          </span>
          {billing === "yearly" && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
              Save up to 25%
            </span>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billing === "monthly" ? plan.price.monthly : plan.price.yearly;

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${plan.borderColor} bg-[#0d1117] p-5 transition-all hover:border-opacity-80 ${
                plan.popular ? "ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/10" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan icon & name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${plan.gradient}`}>
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${plan.badgeColor}`}>
                    {plan.name === "Free" ? "Forever free" : plan.name === "Premium" ? "Best value" : `${plan.name} plan`}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-gray-800">
                {price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹0</span>
                    <span className="text-gray-500 text-sm">/forever</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</span>
                      <span className="text-gray-500 text-sm">/{billing === "monthly" ? "mo" : "mo"}</span>
                    </div>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-400 mt-0.5">
                        ₹{(price * 12).toLocaleString("en-IN")} billed yearly
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 space-y-2.5 mb-5">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300">{feature}</span>
                  </div>
                ))}
                {plan.missing.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 opacity-40">
                    <X className="h-3.5 w-3.5 text-gray-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-500 line-through">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${plan.ctaClass}`}
              >
                {plan.name === "Free" ? "Current Plan" : `Get ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ / note */}
      <div className="mt-10 text-center">
        <p className="text-gray-500 text-xs">
          All prices are in Indian Rupees (INR) · Secure payment via Razorpay · Cancel anytime
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
          {["No hidden fees", "14-day money back", "Cancel anytime", "Secure & encrypted"].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
