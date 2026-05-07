"use client";

import { useState } from "react";
import type { AnalyzeResult, RewriteResult, SerpResult } from "@/lib/types";
import {
  ArrowLeft,
  Download,
  BarChart2,
  Zap,
  FileText,
  AlertTriangle,
  Wand2,
  Search,
} from "lucide-react";
import {
  cn,
  gradeFromScore,
  gradeLabel,
  gradeText,
  gradeBg,
  gradeBorder,
  pct,
} from "@/lib/utils";
import { keywordFromUrl } from "@/lib/keywordFromSlug";
import { PageProfileCard } from "./PageProfileCard";
import { ModuleScoresGrid } from "./ModuleScoresGrid";
import { SentenceHeatmap } from "./SentenceHeatmap";
import { FindingCard } from "./FindingCard";
import { RewriteTab } from "./RewriteTab";
import { SerpTab } from "./SerpTab";
import { generateTextPdf } from "@/lib/pdf";

type Tab = "overview" | "findings" | "heatmap" | "rewrite" | "serp";

export function ResultsPanel({
  result,
  onReset,
}: {
  result: AnalyzeResult;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sevFilter, setSevFilter] = useState<"all" | "high" | "medium" | "low">(
    "all",
  );
  const [downloading, setDownloading] = useState(false);
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [serp, setSerp] = useState<SerpResult | null>(null);
  const [serpLoading, setSerpLoading] = useState(false);
  const [serpError, setSerpError] = useState<string | null>(null);

  const grade = gradeFromScore(result.overall_score);
  const p = pct(result.overall_score, 100);
  const highCount = result.findings.filter((f) => f.severity === "high").length;
  const weakSentences = result.sentence_scores.filter(
    (s) => s.score === "weak" || s.score === "mid",
  );

  const initialKeyword = result.meta.page_url
    ? keywordFromUrl(
        result.meta.page_url,
        result.page_context.product_name || "",
      )
    : result.page_context.product_name || result.page_context.product_category || "";

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await generateTextPdf(result, rewrite, serp);
    } finally {
      setDownloading(false);
    }
  }

  async function handleGenerateRewrite(
    mode: "mistakes" | "serp" | "both" = "mistakes",
  ) {
    if (rewriteLoading) return;
    setRewriteLoading(true);
    setRewriteError(null);
    try {
      const serpInput = serp
        ? {
            keyword: serp.keyword_used,
            swot_opportunities: serp.swot.opportunities,
            swot_weaknesses: serp.swot.weaknesses,
            differentiation_themes:
              serp.your_page_position.differentiation_themes,
            vs_cluster_strengths:
              serp.your_page_position.vs_cluster_strengths,
            vs_cluster_gaps: serp.your_page_position.vs_cluster_gaps,
          }
        : undefined;

      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          original_text: result.meta.original_text,
          page_context: result.page_context,
          findings: result.findings,
          weak_sentences: weakSentences,
          serp: serpInput,
          page_title: result.meta.page_title,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          (json.error || "Rewrite failed") +
            (json.detail ? ` — ${json.detail}` : ""),
        );
      }
      setRewrite(json as RewriteResult);
    } catch (e) {
      setRewriteError((e as Error).message);
    } finally {
      setRewriteLoading(false);
    }
  }

  async function handleGenerateSerp(keyword: string) {
    if (serpLoading || !keyword.trim()) return;
    setSerpLoading(true);
    setSerpError(null);
    try {
      const res = await fetch("/api/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          page_context: result.page_context,
          page_url: result.meta.page_url,
          page_title: result.meta.page_title,
          original_text: result.meta.original_text,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          (json.error || "SERP analysis failed") +
            (json.detail ? ` — ${json.detail}` : ""),
        );
      }
      setSerp(json as SerpResult);
    } catch (e) {
      setSerpError((e as Error).message);
    } finally {
      setSerpLoading(false);
    }
  }

  const filteredFindings =
    sevFilter === "all"
      ? result.findings
      : result.findings.filter((f) => f.severity === sevFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Analyze another page
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 text-white text-sm font-medium shadow-sm shadow-violet-600/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-6 sm:p-8 mb-6 bg-white shadow-sm",
          gradeBorder(grade),
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className={cn(
              "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-black text-white shrink-0 shadow-md",
              gradeBg(grade),
            )}
          >
            {grade}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold text-gray-900 tabular-nums">
                {result.overall_score}
                <span className="text-gray-400 text-xl font-normal">/100</span>
              </span>
              <span
                className={cn("text-lg font-semibold", gradeText(grade))}
              >
                {gradeLabel(grade)}
              </span>
            </div>
            {result.meta.page_title && (
              <p className="text-gray-500 text-sm mb-3 truncate">
                {result.meta.page_title}
              </p>
            )}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  gradeBg(grade),
                )}
                style={{ width: `${p}%` }}
              />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.summary}
            </p>
          </div>
          <div className="text-right text-xs text-gray-400 shrink-0 hidden sm:block">
            <div>{result.meta.word_count} words</div>
            <div className="mt-1">{result.meta.sentence_count} sentences</div>
            <div className="mt-1">
              {(result.meta.duration_ms / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </div>

      {highCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {highCount} high-severity issue{highCount > 1 ? "s" : ""} —
            biggest leverage if fixed
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.findings
              .filter((f) => f.severity === "high")
              .map((f, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTab("findings");
                    setSevFilter("high");
                  }}
                  className="px-2.5 py-1 bg-white border border-red-200 rounded-md text-red-700 text-xs font-mono hover:bg-red-100 transition-colors"
                >
                  {f.rule_id}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto w-fit">
        {(
          [
            { id: "overview", label: "Overview", icon: BarChart2 },
            {
              id: "findings",
              label: `Findings (${result.findings.length})`,
              icon: Zap,
            },
            { id: "heatmap", label: "Heatmap", icon: FileText },
            { id: "rewrite", label: "Rewrite", icon: Wand2 },
            { id: "serp", label: "SERP", icon: Search },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              tab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <ModuleScoresGrid modules={result.module_scores} />
          <PageProfileCard pc={result.page_context} />
        </div>
      )}

      {tab === "findings" && (
        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {(["all", "high", "medium", "low"] as const).map((f) => {
              const count =
                f === "all"
                  ? result.findings.length
                  : result.findings.filter((x) => x.severity === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setSevFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium capitalize transition-colors",
                    sevFilter === f
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>
          {filteredFindings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No findings at this severity level.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFindings.map((f, i) => (
                <FindingCard key={i} f={f} idx={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "heatmap" && (
        <SentenceHeatmap sentences={result.sentence_scores} />
      )}

      {tab === "rewrite" && (
        <RewriteTab
          result={rewrite}
          loading={rewriteLoading}
          error={rewriteError}
          findingsCount={result.findings.length}
          weakCount={weakSentences.length}
          hasSerp={serp !== null}
          serpThemesCount={
            serp?.your_page_position.differentiation_themes.length ?? 0
          }
          onGenerate={handleGenerateRewrite}
          onSwitchToSerp={() => setTab("serp")}
        />
      )}

      {tab === "serp" && (
        <SerpTab
          result={serp}
          loading={serpLoading}
          error={serpError}
          initialKeyword={initialKeyword}
          onGenerate={handleGenerateSerp}
        />
      )}
    </div>
  );
}
