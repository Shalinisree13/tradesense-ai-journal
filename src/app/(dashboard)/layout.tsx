"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SearchPalette from "@/components/SearchPalette";
import { Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Sidebar handles its own positioning:
          - Mobile: sticky top header + overlay drawer
          - Desktop: fixed left sidebar (w-56) */}
      <Sidebar />

      {/* Content offset only on desktop to clear the fixed sidebar */}
      <div className="md:pl-56">
        {/* Desktop-only top bar */}
        <header className="hidden md:flex h-14 items-center justify-between px-6 bg-[#030712] border-b border-gray-800/40 sticky top-0 z-20">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#090f1d] hover:bg-gray-800/40 border border-gray-800 text-gray-500 rounded-lg text-xs font-medium cursor-pointer transition-colors w-56 text-left"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-grow">Search (Ctrl+K)</span>
            <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-[10px] rounded text-gray-400">
              ⌘K
            </kbd>
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
