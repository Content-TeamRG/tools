"use client";

import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";

export function NavBar({
  onLogoClick,
  onNewAnalysis,
}: {
  onLogoClick?: () => void;
  onNewAnalysis?: () => void;
}) {
  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-gray-900">CRO Analyzer</span>
    </div>
  );

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shrink-0">
      <div className="h-14 px-5 flex items-center justify-between">
        {onLogoClick ? (
          <button onClick={onLogoClick} className="hover:opacity-80 transition-opacity">
            {logo}
          </button>
        ) : (
          <Link href="/" className="hover:opacity-80 transition-opacity">
            {logo}
          </Link>
        )}

        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Pricing
          </Link>
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm shadow-violet-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              New analysis
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
