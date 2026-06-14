"use client";

import { useState } from "react";
import {
  Wand2,
  Loader2,
  Copy,
  Check,
  Download,
  ArrowRight,
  Sparkles,
  Search,
  Target,
  Swords,
} from "lucide-react";
import type { Finding, RewriteMode, RewriteResult, SentenceScore } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RewriteDiffView } from "./RewriteDiffView";

interface RewriteTabProps {
  result: RewriteResult | null;
  loading: boolean;
  error: string | null;
  findingsCount: number;
  weakCount: number;
  hasSerp: boolean;
  serpThemesCount: number;
  originalText: string;
  findings: Finding[];
  sentenceScores: SentenceScore[];
  onGenerate: (mode: RewriteMode, competitorUrl?: string) => void;
  onSwitchToSerp: () => void;
}

const MODES: Array<{
  id: RewriteMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "mistakes",
    label: "Fix mistakes",
    icon: Sparkles,
    description:
      "Apply every CRO finding's suggested rewrite + fix all weak/mid sentences using the rubric. Same page, fixed copy.",
  },
  {
    id: "serp",
    label: "With SERP positioning",
    icon: Search,
    description:
      "Don't fix individual copy mistakes. Reframe the hero, value prop, and core benefit lines to lean into the differentiation themes the SERP analysis surfaced.",
  },
  {
    id: "competitor",
    label: "Competitor positioning",
    icon: Swords,
    description:
      "Reframe the page to beat ONE specific competitor. We analyze the competitor's page, find the modules where they outscore you, and rewrite to close those gaps.",
  },
  {
    id: "both",
    label: "Both (mistakes + SERP)",
    icon: Target,
    description:
      "Fix every finding AND reframe positioning using the SERP differentiation themes. Best-quality rewrite — recommended once you've run the SERP analysis.",
  },
];

function CompetitorField({
  url,
  setUrl,
  loading,
  onRun,
}: {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  onRun: (url: string) => void;
}) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Competitor URL to position against
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://competitor.com/landing-page"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => onRun(url.trim())}
          disabled={loading || !url.trim()}
          className={cn(
            "inline-flex items-center gap-2 px-5 rounded-xl font-semibold text-sm transition-all shrink-0",
            loading || !url.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              Rewrite vs competitor
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        We analyze this competitor, find where they beat your page, and rewrite to close the gap.
      </p>
    </div>
  );
}

export function RewriteTab({
  result,
  loading,
  error,
  findingsCount,
  weakCount,
  hasSerp,
  serpThemesCount,
  originalText,
  findings,
  sentenceScores,
  onGenerate,
  onSwitchToSerp,
}: RewriteTabProps) {
  const [mode, setMode] = useState<RewriteMode>("mistakes");
  const [copied, setCopied] = useState(false);
  const [competitorUrl, setCompetitorUrl] = useState("");

  const modeNeedsSerp = mode === "serp" || mode === "both";
  const blocked = modeNeedsSerp && !hasSerp;
  const isCompetitor = mode === "competitor";

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewritten_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.rewritten_text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rewritten-page-${result.mode_used}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!result) {
    const selectedMode = MODES.find((m) => m.id === mode)!;
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-md">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Rewrite the entire page
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Choose how aggressive the rewrite should be. All modes preserve
              your facts, structure, and voice.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {MODES.map((m) => {
              const requiresSerp = m.id === "serp" || m.id === "both";
              const disabled = requiresSerp && !hasSerp;
              const selected = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  disabled={disabled}
                  className={cn(
                    "w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all",
                    selected && !disabled
                      ? "border-violet-500 bg-violet-50/60 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      selected
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {m.label}
                      </span>
                      {requiresSerp && (
                        <span
                          className={cn(
                            "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                            hasSerp
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200",
                          )}
                        >
                          {hasSerp ? "SERP ready" : "needs SERP"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-all",
                      selected && !disabled
                        ? "border-violet-600 bg-violet-600"
                        : "border-gray-300",
                    )}
                  >
                    {selected && !disabled && (
                      <Check className="w-2.5 h-2.5 text-white m-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900 tabular-nums">
                {findingsCount}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Findings</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 tabular-nums">
                {weakCount}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Weak/mid sentences
              </div>
            </div>
            <div>
              <div
                className={cn(
                  "text-xl font-bold tabular-nums",
                  hasSerp ? "text-gray-900" : "text-gray-300",
                )}
              >
                {hasSerp ? serpThemesCount : "—"}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                SERP themes
              </div>
            </div>
          </div>

          {blocked ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 leading-relaxed mb-3">
                <strong>{selectedMode.label}</strong> needs the SERP analysis
                to be run first — that&apos;s where the differentiation themes
                come from.
              </p>
              <button
                onClick={onSwitchToSerp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Go to SERP tab
              </button>
            </div>
          ) : isCompetitor ? (
            <CompetitorField
              url={competitorUrl}
              setUrl={setCompetitorUrl}
              loading={loading}
              onRun={(u) => onGenerate("competitor", u)}
            />
          ) : (
            <button
              onClick={() => onGenerate(mode)}
              disabled={loading}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all",
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating rewrite&hellip;
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate rewrite — {selectedMode.label}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result view — split diff
  const usedMode = MODES.find((m) => m.id === result.mode_used)!;
  const UsedIcon = usedMode.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
            <UsedIcon className="w-3.5 h-3.5 text-violet-700" />
            <span className="text-xs font-semibold text-violet-700">
              {usedMode.label}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">
              {result.applied_findings_count}
            </span>{" "}
            fixes applied &middot;{" "}
            <span className="tabular-nums">
              {result.meta.original_word_count} &rarr;{" "}
              {result.meta.rewritten_word_count}
            </span>{" "}
            words &middot;{" "}
            <span className="tabular-nums">
              {(result.meta.duration_ms / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download .txt
          </button>
          {!isCompetitor && (
            <button
              onClick={() => onGenerate(mode)}
              disabled={loading || blocked}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 hover:bg-violet-100 text-violet-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              {mode === result.mode_used
                ? "Try again"
                : `Try ${MODES.find((m) => m.id === mode)?.label.toLowerCase()}`}
            </button>
          )}
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit flex-wrap">
        {MODES.map((m) => {
          const requiresSerp = m.id === "serp" || m.id === "both";
          const isDisabled = requiresSerp && !hasSerp;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              disabled={isDisabled}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                mode === m.id && !isDisabled
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Competitor URL field — shown when competitor mode is selected */}
      {isCompetitor && (
        <CompetitorField
          url={competitorUrl}
          setUrl={setCompetitorUrl}
          loading={loading}
          onRun={(u) => onGenerate("competitor", u)}
        />
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Split diff view */}
      <RewriteDiffView
        originalText={originalText}
        rewrittenText={result.rewritten_text}
        findings={findings}
        sentenceScores={sentenceScores}
        changeLog={result.change_log}
      />
    </div>
  );
}
