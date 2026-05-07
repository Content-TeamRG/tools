import type { ModuleScore } from "@/lib/types";
import { cn, pct, pctBarColor, pctTextColor } from "@/lib/utils";

export function ModuleScoresGrid({ modules }: { modules: ModuleScore[] }) {
  const sorted = [...modules].sort(
    (a, b) => pct(a.score, a.max) - pct(b.score, b.max),
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((m) => {
        const p = pct(m.score, m.max);
        return (
          <div
            key={m.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                {m.id.replace(/_/g, " ")}
              </span>
              <span className={cn("text-sm font-bold tabular-nums", pctTextColor(p))}>
                {m.score}
                <span className="text-gray-400 font-normal">/{m.max}</span>
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900 mb-3 leading-snug">
              {m.name}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
              <div
                className={cn("h-1.5 rounded-full transition-all", pctBarColor(p))}
                style={{ width: `${Math.max(2, p)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {m.one_line_diagnosis}
            </p>
          </div>
        );
      })}
    </div>
  );
}
