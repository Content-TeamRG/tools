"use client";

import type { AnalyzeResult, ModuleScore } from "@/lib/types";
import {
  ArrowLeft,
  Trophy,
  Minus,
  ExternalLink,
} from "lucide-react";
import {
  cn,
  gradeFromScore,
  gradeLabel,
  gradeText,
  gradeBg,
  gradeBorder,
  pct,
  pctBarColor,
  pctTextColor,
  moduleLabel,
} from "@/lib/utils";

function hostOf(url?: string, fallback?: string): string {
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return fallback || "Untitled page";
}

function PageColumn({
  result,
  side,
  isWinner,
}: {
  result: AnalyzeResult;
  side: "A" | "B";
  isWinner: boolean;
}) {
  const grade = gradeFromScore(result.overall_score);
  const p = pct(result.overall_score, 100);
  const host = hostOf(result.meta.page_url, result.meta.page_title);
  const sideLabel = side === "A" ? "Your page" : "Competitor";
  const accent = side === "A" ? "violet" : "slate";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm p-5 sm:p-6 flex flex-col gap-4 relative",
        isWinner ? gradeBorder(grade) : "border-gray-200",
      )}
    >
      {isWinner && (
        <div className="absolute -top-3 left-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[11px] font-bold shadow-sm">
          <Trophy className="w-3 h-3" />
          Winner
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
            accent === "violet"
              ? "bg-violet-50 text-violet-700"
              : "bg-slate-100 text-slate-700",
          )}
        >
          {sideLabel}
        </span>
        {result.meta.page_url && (
          <a
            href={result.meta.page_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 truncate max-w-[60%]"
          >
            <span className="truncate">{host}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black text-white shrink-0 shadow-md",
            gradeBg(grade),
          )}
        >
          {grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              {result.overall_score}
              <span className="text-gray-400 text-lg font-normal">/100</span>
            </span>
            <span className={cn("text-sm font-semibold", gradeText(grade))}>
              {gradeLabel(grade)}
            </span>
          </div>
          {result.meta.page_title && (
            <p className="text-xs text-gray-500 truncate">
              {result.meta.page_title}
            </p>
          )}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className={cn("h-1.5 rounded-full transition-all", gradeBg(grade))}
              style={{ width: `${p}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>

      <div className="text-[11px] text-gray-400 flex gap-3 mt-auto pt-2 border-t border-gray-100">
        <span>{result.meta.word_count} words</span>
        <span>{result.meta.sentence_count} sentences</span>
        <span>{result.findings.length} findings</span>
      </div>
    </div>
  );
}

function ModuleRow({
  modA,
  modB,
}: {
  modA: ModuleScore;
  modB: ModuleScore;
}) {
  const pA = pct(modA.score, modA.max);
  const pB = pct(modB.score, modB.max);
  const winner: "A" | "B" | "tie" = pA > pB ? "A" : pB > pA ? "B" : "tie";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
            {modA.id.replace(/_/g, " ")}
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {moduleLabel(modA.id)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          {winner === "tie" ? (
            <span className="flex items-center gap-1 text-gray-500">
              <Minus className="w-3 h-3" />
              Tie
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-700">
              <Trophy className="w-3 h-3" />
              {winner === "A" ? "Your page" : "Competitor"} wins
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <SideCell mod={modA} side="A" isWinner={winner === "A"} />
        <SideCell mod={modB} side="B" isWinner={winner === "B"} />
      </div>
    </div>
  );
}

function SideCell({
  mod,
  side,
  isWinner,
}: {
  mod: ModuleScore;
  side: "A" | "B";
  isWinner: boolean;
}) {
  const p = pct(mod.score, mod.max);
  return (
    <div
      className={cn(
        "p-4 transition-colors",
        isWinner && "bg-emerald-50/50",
      )}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {side === "A" ? "Your page" : "Competitor"}
        </span>
        <span className={cn("text-base font-bold tabular-nums", pctTextColor(p))}>
          {mod.score}
          <span className="text-gray-400 font-normal text-sm">/{mod.max}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className={cn("h-1.5 rounded-full transition-all", pctBarColor(p))}
          style={{ width: `${Math.max(2, p)}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        {mod.one_line_diagnosis}
      </p>
    </div>
  );
}

export interface ComparePair {
  a: AnalyzeResult;
  b: AnalyzeResult;
}

export function CompareResultsPanel({
  pair,
  onReset,
}: {
  pair: ComparePair;
  onReset: () => void;
}) {
  const { a, b } = pair;
  const aWins = a.overall_score > b.overall_score;
  const bWins = b.overall_score > a.overall_score;
  const tie = !aWins && !bWins;

  const aHost = hostOf(a.meta.page_url, a.meta.page_title);
  const bHost = hostOf(b.meta.page_url, b.meta.page_title);
  const diff = Math.abs(a.overall_score - b.overall_score);

  // Align modules by id; fall back to index if mismatched.
  const modulesA = a.module_scores;
  const modulesB = b.module_scores;
  const rows = modulesA
    .map((m, i) => {
      const match = modulesB.find((x) => x.id === m.id) ?? modulesB[i];
      return match ? { modA: m, modB: match } : null;
    })
    .filter(Boolean) as { modA: ModuleScore; modB: ModuleScore }[];

  const aModuleWins = rows.filter(
    (r) => pct(r.modA.score, r.modA.max) > pct(r.modB.score, r.modB.max),
  ).length;
  const bModuleWins = rows.filter(
    (r) => pct(r.modB.score, r.modB.max) > pct(r.modA.score, r.modA.max),
  ).length;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pt-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500 flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Use{" "}
          <span className="font-medium text-gray-700">New analysis</span> in
          the top bar to start another
        </div>
      </div>

      {/* Verdict banner */}
      <div
        className={cn(
          "rounded-2xl border p-5 mb-6 flex items-center gap-4",
          tie
            ? "bg-gray-50 border-gray-200"
            : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
            tie
              ? "bg-gray-300 text-white"
              : "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
          )}
        >
          {tie ? <Minus className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          {tie ? (
            <>
              <div className="text-base font-bold text-gray-900">
                It&apos;s a tie — {a.overall_score}/100 each
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                Both pages score identically overall. Use the per-module
                breakdown to find where each one pulls ahead.
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-bold text-gray-900">
                {aWins ? "Your page" : "Competitor"} ranks higher by {diff}{" "}
                point{diff === 1 ? "" : "s"}
              </div>
              <div className="text-sm text-gray-700 mt-0.5">
                <span className="font-semibold">
                  {aWins ? aHost : bHost}
                </span>{" "}
                scores {aWins ? a.overall_score : b.overall_score}/100 vs{" "}
                <span className="font-semibold">
                  {aWins ? bHost : aHost}
                </span>{" "}
                at {aWins ? b.overall_score : a.overall_score}/100 · wins{" "}
                {aWins ? aModuleWins : bModuleWins} of {rows.length} modules
              </div>
            </>
          )}
        </div>
      </div>

      {/* Split view header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PageColumn result={a} side="A" isWinner={aWins} />
        <PageColumn result={b} side="B" isWinner={bWins} />
      </div>

      {/* Per-module split view */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Module-by-module breakdown
        </h3>
        <p className="text-xs text-gray-500">
          Side-by-side scores across the 6 CRO modules. Winning side is
          highlighted in green per row.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <ModuleRow key={i} modA={r.modA} modB={r.modB} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Run another comparison
        </button>
      </div>
    </div>
  );
}
