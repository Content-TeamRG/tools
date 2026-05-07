"use client";

import { useState } from "react";
import type { Finding } from "@/lib/types";
import { ChevronDown, ChevronUp, AlertTriangle, Sparkles } from "lucide-react";
import { cn, severityBadge } from "@/lib/utils";

export function FindingCard({ f, idx }: { f: Finding; idx: number }) {
  const [expanded, setExpanded] = useState(idx === 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
      <button
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-mono text-xs text-gray-400 w-6 shrink-0">
          {String(idx + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0",
            severityBadge(f.severity),
          )}
        >
          {f.severity}
        </span>
        <span className="font-mono text-[11px] text-gray-500 shrink-0">
          {f.rule_id}
        </span>
        <span className="text-sm text-gray-700 flex-1 truncate italic">
          “{f.original_sentence}”
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4 animate-fade-in">
          <blockquote className="border-l-2 border-gray-300 pl-3 mt-3 text-sm text-gray-700 italic">
            “{f.original_sentence}”
          </blockquote>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-700 mb-1.5">
              <AlertTriangle className="w-3 h-3" />
              Why this fails for this audience
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {f.why_it_fails_for_this_audience}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Suggested rewrite
            </div>
            <p className="text-sm text-gray-900 font-medium leading-relaxed bg-violet-50 border border-violet-200 px-3 py-2.5 rounded-lg">
              {f.rewrite_suggestion}
            </p>
            {f.rewrite_explanation && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {f.rewrite_explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
