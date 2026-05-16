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

type HighlightKind = "finding" | "weak" | "mid" | "change" | null;

interface AnnotatedParagraph {
  text: string;
  tooltip: string | null;
  kind: HighlightKind;
}

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function paraContains(para: string, fragment: string): boolean {
  const p = normalize(para).toLowerCase();
  const f = normalize(fragment).toLowerCase();
  if (f.length < 12) return false;
  return p.includes(f) || f.includes(p);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function annotateOriginal(
  paragraphs: string[],
  findings: Finding[],
  sentenceScores: SentenceScore[],
): AnnotatedParagraph[] {
  return paragraphs.map((para) => {
    for (const f of findings) {
      if (paraContains(para, f.original_sentence)) {
        return { text: para, tooltip: f.why_it_fails_for_this_audience, kind: "finding" };
      }
    }
    for (const s of sentenceScores) {
      if (s.score === "weak" && paraContains(para, s.text)) {
        return { text: para, tooltip: s.one_line_reason || null, kind: "weak" };
      }
    }
    for (const s of sentenceScores) {
      if (s.score === "mid" && paraContains(para, s.text)) {
        return { text: para, tooltip: s.one_line_reason || null, kind: "mid" };
      }
    }
    return { text: para, tooltip: null, kind: null };
  });
}

function annotateRewritten(
  paragraphs: string[],
  changeLog: RewriteChange[],
): AnnotatedParagraph[] {
  return paragraphs.map((para) => {
    for (const c of changeLog) {
      if (paraContains(para, c.after)) {
        return { text: para, tooltip: c.reason || null, kind: "change" };
      }
    }
    return { text: para, tooltip: null, kind: null };
  });
}

function Paragraph({
  para,
  side,
  index,
  hovered,
  onEnter,
  onLeave,
}: {
  para: AnnotatedParagraph;
  side: "left" | "right";
  index: number;
  hovered: number | null;
  onEnter: (i: number) => void;
  onLeave: () => void;
}) {
  const isHovered = hovered === index;
  const hasTooltip = !!para.tooltip;

  const bgClass = cn(
    "rounded-lg px-3 py-2 -mx-3 transition-colors leading-7 text-[14px] cursor-default whitespace-pre-wrap",
    para.kind === "finding" && "bg-red-100/70 text-gray-800",
    para.kind === "weak" && "bg-red-50 text-gray-800",
    para.kind === "mid" && "bg-amber-50 text-gray-800",
    para.kind === "change" && "bg-emerald-50 text-gray-800",
    para.kind === null && "text-gray-700",
    isHovered && hasTooltip && para.kind === "finding" && "bg-red-200/60",
    isHovered && hasTooltip && para.kind === "weak" && "bg-red-100",
    isHovered && hasTooltip && para.kind === "mid" && "bg-amber-100",
    isHovered && hasTooltip && para.kind === "change" && "bg-emerald-100",
  );

  const tooltipBg = side === "left" ? "bg-red-900" : "bg-emerald-900";

  return (
    <div
      className="relative"
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={onLeave}
    >
      <p className={bgClass}>{para.text}</p>
      {isHovered && hasTooltip && (
        <div
          className={cn(
            "mt-1.5 z-50 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed shadow-lg",
            tooltipBg,
          )}
        >
          {para.tooltip}
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

  const origParas = originalText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const rewriteParas = rewrittenText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const annotatedOrig = annotateOriginal(origParas, findings, sentenceScores);
  const annotatedRewrite = annotateRewritten(rewriteParas, changeLog);

  const leftHighlighted = annotatedOrig.filter((p) => p.kind !== null).length;
  const rightHighlighted = annotatedRewrite.filter((p) => p.kind !== null).length;
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
      {/* Sticky column header bar */}
      <div className="sticky top-14 z-20 grid grid-cols-2 border border-gray-200 rounded-t-2xl overflow-hidden bg-white shadow-sm">
        {/* Left header */}
        <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-r border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-700">
              Before
            </span>
            <span className="text-[11px] text-gray-500">
              {leftHighlighted} issue{leftHighlighted !== 1 ? "s" : ""} flagged
            </span>
          </div>
          <span className="text-[11px] text-gray-400 tabular-nums">{origWords} words</span>
        </div>

        {/* Right header */}
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-50">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              After
            </span>
            <span className="text-[11px] text-gray-500">
              {rightHighlighted} section{rightHighlighted !== 1 ? "s" : ""} rewritten
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 tabular-nums">{rewriteWords} words</span>
            {/* Sync scroll toggle */}
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
                <path d="M4 2h8a1 1 0 011 1v3h-1V3H4v2H3V3a1 1 0 011-1zM3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2h-1v2H4v-2H3z"/>
                <path fillRule="evenodd" d="M0 8a1 1 0 011-1h14a1 1 0 010 2H1a1 1 0 01-1-1z"/>
              </svg>
              Sync scroll
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-2 border-x border-b border-gray-200 rounded-b-2xl overflow-hidden">
        {/* Left panel */}
        <div
          ref={leftRef}
          onScroll={handleLeftScroll}
          className="border-r border-gray-200 p-5 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]"
        >
          {annotatedOrig.map((para, i) => (
            <Paragraph
              key={i}
              para={para}
              side="left"
              index={i}
              hovered={hoveredLeft}
              onEnter={setHoveredLeft}
              onLeave={() => setHoveredLeft(null)}
            />
          ))}
        </div>

        {/* Right panel */}
        <div
          ref={rightRef}
          onScroll={handleRightScroll}
          className="p-5 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]"
        >
          {annotatedRewrite.map((para, i) => (
            <Paragraph
              key={i}
              para={para}
              side="right"
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
          <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" />
          CRO finding
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-100 inline-block" />
          Weak / mid sentence
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block" />
          Rewritten
        </div>
        <span className="text-gray-400">· hover any highlighted section to see reasoning</span>
      </div>
    </div>
  );
}
