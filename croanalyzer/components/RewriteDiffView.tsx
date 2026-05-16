"use client";

import { useState } from "react";
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
            side === "right" ? "ml-0" : "ml-0",
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

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
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

      {/* Split panels */}
      <div className="grid grid-cols-2 border border-gray-200 rounded-2xl">
        {/* Column headers */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-r border-gray-200 rounded-tl-2xl bg-red-50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
            Before
          </span>
          <span className="text-[11px] text-gray-400">
            {leftHighlighted} issue{leftHighlighted !== 1 ? "s" : ""} flagged
          </span>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200 rounded-tr-2xl bg-emerald-50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            After
          </span>
          <span className="text-[11px] text-gray-400">
            {rightHighlighted} section{rightHighlighted !== 1 ? "s" : ""} rewritten
          </span>
        </div>

        {/* Left panel */}
        <div className="border-r border-gray-200 p-5 space-y-2 overflow-y-auto max-h-[68vh]">
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
        <div className="p-5 space-y-2 overflow-y-auto max-h-[68vh]">
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
    </div>
  );
}
