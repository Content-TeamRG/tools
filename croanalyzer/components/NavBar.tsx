"use client";

import { Sparkles } from "lucide-react";

export function NavBar({ onReset }: { onReset?: () => void }) {
  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 group-hover:text-black transition-colors">
            CRO Analyzer
          </span>
        </button>
        <div className="text-xs text-gray-500">
          Reasoning grounded in your page
        </div>
      </div>
    </nav>
  );
}
