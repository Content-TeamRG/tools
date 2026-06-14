"use client";

import { useRef, useState } from "react";
import type { Finding, SentenceScore, RewriteChange } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  originalText: string;
  rewrittenText: string;
  findings: Finding[];
  sentenceScores: SentenceScore[];
  changeLog: RewriteChange[];
}

type Variant = "error" | "change" | "keep" | "plain";

interface Block {
  text: string;
  label: string | null;
  tooltip: string | null;
  variant: Variant;
  isHeading: boolean;
}

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function paraContains(a: string, b: string): boolean {
  const x = normalize(a).toLowerCase();
  const y = normalize(b).toLowerCase();
  if (y.length < 12) return false;
  return x.includes(y) || y.includes(x);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Short, punctuation-free lines read as section headings — render with hierarchy.
function looksLikeHeading(text: string) {
  const t = text.trim();
  return t.length > 0 && t.length <= 52 && wordCount(t) <= 8 && !/[.!?:,;]$/.test(t);
}

function splitParas(text: string) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// LEFT — built from sentence-level scores so every sentence is its own clearly
// delineated block and errors are pinpointed exactly (not a wall of text).
function buildLeftBlocks(sentenceScores: SentenceScore[], findings: Finding[]): Block[] {
  return sentenceScores.map((s) => {
    const isHeading = looksLikeHeading(s.text);
    const finding = findings.find(
      (f) => paraContains(s.text, f.original_sentence) || paraContains(f.original_sentence, s.text),
    );
    if (finding) {
      return {
        text: s.text,
        label: `${finding.severity} · ${finding.rule_id}`,
        tooltip: finding.why_it_fails_for_this_audience,
        variant: "error",
        isHeading,
      };
    }
    if (s.score === "weak" || s.score === "mid") {
      return {
        text: s.text,
        label: s.rule_id || s.score,
        tooltip: s.one_line_reason || null,
        variant: "error",
        isHeading,
      };
    }
    return { text: s.text, label: null, tooltip: null, variant: "plain", isHeading };
  });
}

// RIGHT — the rewritten page; changed sections green, kept-as-is blue.
function buildRightBlocks(rewrittenText: string, changeLog: RewriteChange[]): Block[] {
  return splitParas(rewrittenText).map((para) => {
    const isHeading = looksLikeHeading(para);
    const change = changeLog.find((c) => paraContains(para, c.after));
    if (change) {
      return { text: para, label: "rewritten", tooltip: change.reason || null, variant: "change", isHeading };
    }
    return { text: para, label: "kept", tooltip: null, variant: "keep", isHeading };
  });
}

const VARIANT_STYLES: Record<
  Variant,
  { card: string; hover: string; tooltip: string; label: string }
> = {
  error: {
    card: "border-l-4 border-l-red-400 bg-red-50/60 border-y border-r border-red-100",
    hover: "bg-red-100/70",
    tooltip: "bg-red-900",
    label: "text-red-700 bg-red-100/70",
  },
  change: {
    card: "border-l-4 border-l-emerald-400 bg-emerald-50/70 border-y border-r border-emerald-100",
    hover: "bg-emerald-100/70",
    tooltip: "bg-emerald-900",
    label: "text-emerald-700 bg-emerald-100/70",
  },
  keep: {
    card: "border-l-4 border-l-blue-300 bg-blue-50/40 border-y border-r border-blue-100",
    hover: "bg-blue-50",
    tooltip: "bg-blue-900",
    label: "text-blue-700 bg-blue-100/60",
  },
  plain: {
    card: "border border-gray-100 bg-white",
    hover: "bg-gray-50",
    tooltip: "bg-gray-900",
    label: "text-gray-500 bg-gray-100",
  },
};

function BlockView({
  block,
  index,
  hovered,
  onEnter,
  onLeave,
}: {
  block: Block;
  index: number;
  hovered: number | null;
  onEnter: (i: number) => void;
  onLeave: () => void;
}) {
  const isHovered = hovered === index;
  const hasTooltip = !!block.tooltip;
  const s = VARIANT_STYLES[block.variant];
  const showLabel = block.label && block.variant !== "plain" && block.variant !== "keep";

  return (
    <div className="relative" onMouseEnter={() => onEnter(index)} onMouseLeave={onLeave}>
      <div className={cn("rounded-lg px-4 py-3 transition-colors", s.card, isHovered && hasTooltip && s.hover)}>
        {showLabel && (
          <div
            className={cn(
              "inline-block mb-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider",
              s.label,
            )}
          >
            {block.label}
          </div>
        )}
        <p
          className={cn(
            "whitespace-pre-wrap",
            block.isHeading
              ? "text-[15px] font-semibold text-gray-900 leading-snug"
              : "text-[14px] leading-7 text-gray-800",
          )}
        >
          {block.text}
        </p>
      </div>
      {isHovered && hasTooltip && (
        <div
          className={cn(
            "mt-1.5 z-50 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed shadow-lg",
            s.tooltip,
          )}
        >
          {block.tooltip}
        </div>
      )}
    </div>
  );
}

export function RewriteDiffView({
  originalText,
  rewrittenText,
  findings,
  sentenceScores,
  changeLog,
}: Props) {
  const [hoveredLeft, setHoveredLeft] = useState<number | null>(null);
  const [hoveredRight, setHoveredRight] = useState<number | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const leftBlocks = buildLeftBlocks(sentenceScores, findings);
  const rightBlocks = buildRightBlocks(rewrittenText, changeLog);

  const issueCount = leftBlocks.filter((b) => b.variant === "error").length;
  const changedCount = rightBlocks.filter((b) => b.variant === "change").length;
  const origWords = wordCount(originalText);
  const rewriteWords = wordCount(rewrittenText);

  function handleLeftScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!syncScroll || isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (rightRef.current) rightRef.current.scrollTop = (e.target as HTMLDivElement).scrollTop;
    isSyncingRef.current = false;
  }

  function handleRightScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!syncScroll || isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (leftRef.current) leftRef.current.scrollTop = (e.target as HTMLDivElement).scrollTop;
    isSyncingRef.current = false;
  }

  return (
    <div className="flex flex-col">
      {/* Sticky column header bar — white, neutral */}
      <div className="sticky top-14 z-20 grid grid-cols-2 border border-gray-200 rounded-t-2xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-r border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-700">Before</span>
            <span className="text-[11px] text-gray-500">
              {issueCount} issue{issueCount !== 1 ? "s" : ""} flagged · {leftBlocks.length} sentences
            </span>
          </div>
          <span className="text-[11px] text-gray-400 tabular-nums">{origWords} words</span>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-700">After</span>
            <span className="text-[11px] text-gray-500">
              {changedCount} section{changedCount !== 1 ? "s" : ""} rewritten
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 tabular-nums">{rewriteWords} words</span>
            <button
              onClick={() => setSyncScroll((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
                syncScroll
                  ? "bg-violet-50 border-violet-200 text-violet-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300",
              )}
            >
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2h8a1 1 0 011 1v3h-1V3H4v2H3V3a1 1 0 011-1zM3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2h-1v2H4v-2H3z" />
                <path fillRule="evenodd" d="M0 8a1 1 0 011-1h14a1 1 0 010 2H1a1 1 0 01-1-1z" />
              </svg>
              Sync scroll
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side panels — both white */}
      <div className="grid grid-cols-2 border-x border-b border-gray-200 rounded-b-2xl overflow-hidden bg-white">
        <div
          ref={leftRef}
          onScroll={handleLeftScroll}
          className="border-r border-gray-200 p-5 space-y-3 overflow-y-auto h-[calc(100vh-8rem)]"
        >
          {leftBlocks.map((block, i) => (
            <BlockView
              key={i}
              block={block}
              index={i}
              hovered={hoveredLeft}
              onEnter={setHoveredLeft}
              onLeave={() => setHoveredLeft(null)}
            />
          ))}
        </div>

        <div
          ref={rightRef}
          onScroll={handleRightScroll}
          className="p-5 space-y-3 overflow-y-auto h-[calc(100vh-8rem)]"
        >
          {rightBlocks.map((block, i) => (
            <BlockView
              key={i}
              block={block}
              index={i}
              hovered={hoveredRight}
              onEnter={setHoveredRight}
              onLeave={() => setHoveredRight(null)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-4 border-l-red-400 bg-red-50 inline-block" />
          Issue flagged (left)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-4 border-l-emerald-400 bg-emerald-50 inline-block" />
          Rewritten (right)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-l-4 border-l-blue-300 bg-blue-50 inline-block" />
          Kept as-is (right)
        </div>
        <span className="text-gray-400">· hover a highlighted block to see the reasoning</span>
      </div>
    </div>
  );
}
