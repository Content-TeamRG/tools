"use client";

import { cn } from "@/lib/utils";
import { gradeFromScore, gradeBg } from "@/lib/utils";
import type { AnalyzeResult } from "@/lib/types";

export interface SessionEntry {
  id: string;
  result: AnalyzeResult;
  createdAt: number;
}

function getLabel(result: AnalyzeResult): string {
  if (result.meta.page_url) {
    try {
      return new URL(result.meta.page_url).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return result.meta.page_title || "Untitled page";
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function SessionSidebar({
  sessions,
  activeId,
  onSelect,
}: {
  sessions: SessionEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2">
          This session
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {sessions.map((s) => {
          const grade = gradeFromScore(s.result.overall_score);
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors group",
                isActive
                  ? "bg-violet-50 border border-violet-200"
                  : "hover:bg-gray-50 border border-transparent",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm",
                  gradeBg(grade),
                )}
              >
                {grade}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium truncate",
                    isActive ? "text-violet-900" : "text-gray-800",
                  )}
                >
                  {getLabel(s.result)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {s.result.overall_score}/100 &middot; {timeAgo(s.createdAt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
