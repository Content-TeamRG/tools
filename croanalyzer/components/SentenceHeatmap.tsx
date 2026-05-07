"use client";

import type { SentenceScore } from "@/lib/types";

export function SentenceHeatmap({
  sentences,
}: {
  sentences: SentenceScore[];
}) {
  const counts = sentences.reduce(
    (acc, s) => {
      acc[s.score]++;
      return acc;
    },
    { weak: 0, mid: 0, ok: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500">Color key:</span>
        <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700">
          {counts.weak} weak
        </span>
        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
          {counts.mid} mid
        </span>
        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
          {counts.ok} ok
        </span>
        <span className="text-gray-500 ml-auto">
          Hover a highlighted sentence for the rule + reason
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-h-[640px] overflow-y-auto scrollbar-thin shadow-sm">
        <div className="text-[15px] leading-7 text-gray-800">
          {sentences.map((s) => (
            <span key={s.id} className="inline">
              <span
                className={
                  s.score === "weak"
                    ? "s-weak"
                    : s.score === "mid"
                      ? "s-mid"
                      : "s-ok"
                }
                title={
                  s.score !== "ok" && s.one_line_reason
                    ? `${s.rule_id || "rule"}: ${s.one_line_reason}`
                    : undefined
                }
              >
                {s.text}
              </span>{" "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
