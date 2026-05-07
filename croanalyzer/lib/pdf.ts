"use client";

import type { AnalyzeResult, RewriteResult, SerpResult } from "./types";
import { gradeFromScore, gradeLabel, moduleLabel } from "./utils";

export async function generateTextPdf(
  result: AnalyzeResult,
  rewrite: RewriteResult | null = null,
  serp: SerpResult | null = null,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  function newPageIfNeeded(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeLine(
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      gap?: number;
    } = {},
  ) {
    const { size = 10, bold = false, gap = 4 } = opts;
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = size * 1.4;
    for (const line of lines) {
      newPageIfNeeded(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  }

  function rule(gap = 8) {
    newPageIfNeeded(8);
    doc.setDrawColor(180);
    doc.line(margin, y, margin + maxWidth, y);
    y += gap;
  }

  function heading(text: string, size = 14) {
    y += 6;
    newPageIfNeeded(size + 12);
    writeLine(text, { size, bold: true, gap: 6 });
    rule(8);
  }

  function subheading(text: string) {
    y += 2;
    writeLine(text, { size: 11, bold: true, gap: 4 });
  }

  // ── Header ──────────────────────────────────────────────
  writeLine("CRO ANALYSIS REPORT", { size: 18, bold: true, gap: 8 });
  rule(10);
  writeLine(`Page: ${result.meta.page_title || "(untitled)"}`, { size: 10 });
  writeLine(`Words analyzed: ${result.meta.word_count} · Sentences: ${result.meta.sentence_count}`, { size: 10 });
  writeLine(`Analysis duration: ${(result.meta.duration_ms / 1000).toFixed(1)}s`, { size: 10 });
  writeLine(`Generated: ${new Date().toISOString()}`, { size: 10, gap: 12 });

  // ── Overall ─────────────────────────────────────────────
  const grade = gradeFromScore(result.overall_score);
  writeLine(
    `OVERALL SCORE: ${result.overall_score}/100 — Grade ${grade} (${gradeLabel(grade)})`,
    { size: 14, bold: true, gap: 8 },
  );
  rule(10);

  subheading("SUMMARY");
  writeLine(result.summary, { size: 10, gap: 12 });

  // ── Module Breakdown ────────────────────────────────────
  heading("MODULE BREAKDOWN");
  for (const m of result.module_scores) {
    const name = m.name || moduleLabel(m.id);
    writeLine(`${name} — ${m.score}/${m.max}`, {
      size: 11,
      bold: true,
      gap: 2,
    });
    writeLine(m.one_line_diagnosis, { size: 10, gap: 8 });
  }

  // ── Page Profile ────────────────────────────────────────
  heading("PAGE PROFILE");
  const pc = result.page_context;
  const profileFields: Array<[string, string | undefined]> = [
    ["Industry", pc.industry],
    ["Sub-vertical", pc.sub_vertical],
    ["ICP", pc.icp],
    ["ICP Seniority", pc.icp_seniority],
    ["Product", pc.product_name],
    ["Product Category", pc.product_category],
    ["Core Value Prop", pc.core_value_prop],
    ["Voice Tone", pc.voice_markers?.tone],
    ["Formality", pc.voice_markers?.formality],
    ["Perspective", pc.voice_markers?.perspective],
    ["Uses Jargon", pc.voice_markers?.uses_jargon ? "Yes" : "No"],
    ["Pricing Model", pc.pricing_model_signal],
    ["Social Proof Style", pc.social_proof_style],
  ];
  for (const [k, v] of profileFields) {
    if (v && v !== "unclear") {
      writeLine(`${k}: ${v}`, { size: 10, gap: 2 });
    }
  }
  if (pc.key_pain_points?.length) {
    y += 4;
    subheading("Key Pain Points");
    for (const p of pc.key_pain_points) writeLine(`• ${p}`, { size: 10, gap: 2 });
  }
  if (pc.terminology?.length) {
    y += 4;
    subheading("Their Terminology");
    writeLine(pc.terminology.join(" · "), { size: 10, gap: 2 });
  }
  if (pc.competitor_mentions?.length) {
    y += 4;
    subheading("Competitor Mentions");
    writeLine(pc.competitor_mentions.join(" · "), { size: 10, gap: 2 });
  }

  // ── Findings ────────────────────────────────────────────
  heading(`FINDINGS (${result.findings.length})`);
  result.findings.forEach((f, i) => {
    writeLine(
      `#${i + 1} — ${f.severity.toUpperCase()} — ${f.rule_id}`,
      { size: 11, bold: true, gap: 2 },
    );
    writeLine(`Original: "${f.original_sentence}"`, { size: 10, gap: 4 });
    subheading("Why this fails for this audience");
    writeLine(f.why_it_fails_for_this_audience, { size: 10, gap: 4 });
    subheading("Suggested rewrite");
    writeLine(f.rewrite_suggestion, { size: 10, gap: 2 });
    if (f.rewrite_explanation) {
      writeLine(`Why: ${f.rewrite_explanation}`, { size: 10, gap: 8 });
    }
    rule(10);
  });

  // ── Sentence Heatmap ────────────────────────────────────
  heading("SENTENCE HEATMAP");
  const weak = result.sentence_scores.filter((s) => s.score === "weak");
  const mid = result.sentence_scores.filter((s) => s.score === "mid");
  const ok = result.sentence_scores.filter((s) => s.score === "ok");

  if (weak.length) {
    subheading(`WEAK (${weak.length})`);
    for (const s of weak) {
      writeLine(`• ${s.text}`, { size: 10, gap: 1 });
      if (s.rule_id || s.one_line_reason) {
        writeLine(`  → ${s.rule_id}: ${s.one_line_reason}`, {
          size: 9,
          gap: 4,
        });
      }
    }
  }
  if (mid.length) {
    y += 4;
    subheading(`MID (${mid.length})`);
    for (const s of mid) {
      writeLine(`• ${s.text}`, { size: 10, gap: 1 });
      if (s.rule_id || s.one_line_reason) {
        writeLine(`  → ${s.rule_id}: ${s.one_line_reason}`, {
          size: 9,
          gap: 4,
        });
      }
    }
  }
  if (ok.length) {
    y += 4;
    subheading(`OK (${ok.length})`);
    writeLine(
      "Sentences that meet the rubric on all evaluated copy-quality rules. Not listed individually for brevity.",
      { size: 10, gap: 4 },
    );
  }

  // ── Rewritten Page (if generated) ───────────────────────
  if (rewrite && rewrite.rewritten_text) {
    doc.addPage();
    y = margin;
    writeLine("REWRITTEN PAGE COPY", { size: 18, bold: true, gap: 8 });
    rule(10);
    const modeLabel =
      rewrite.mode_used === "mistakes"
        ? "Fix mistakes"
        : rewrite.mode_used === "serp"
          ? "With SERP positioning"
          : "Both — mistakes + SERP positioning";
    writeLine(`Mode: ${modeLabel}`, { size: 10, bold: true });
    writeLine(
      `Word count: ${rewrite.meta.original_word_count} → ${rewrite.meta.rewritten_word_count} · Applied: ${rewrite.applied_findings_count} fixes · Generated in ${(rewrite.meta.duration_ms / 1000).toFixed(1)}s`,
      { size: 9, gap: 14 },
    );

    const paragraphs = rewrite.rewritten_text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of paragraphs) {
      writeLine(p, { size: 10, gap: 8 });
    }

    if (rewrite.change_log.length > 0) {
      heading("CHANGE LOG");
      rewrite.change_log.forEach((c, i) => {
        writeLine(`#${i + 1}`, { size: 11, bold: true, gap: 2 });
        writeLine(`Before: "${c.before}"`, { size: 10, gap: 2 });
        writeLine(`After:  ${c.after}`, { size: 10, gap: 2 });
        if (c.reason) writeLine(`Why:    ${c.reason}`, { size: 10, gap: 8 });
        else y += 4;
      });
    }
  }

  // ── SERP Analysis (if generated) ────────────────────────
  if (serp) {
    doc.addPage();
    y = margin;
    writeLine("SERP ANALYSIS", { size: 18, bold: true, gap: 8 });
    rule(10);
    writeLine(`Keyword: "${serp.keyword_used}"`, { size: 10 });
    writeLine(
      `Competitors analyzed: ${serp.meta.competitors_fetched}${serp.meta.competitors_failed > 0 ? ` (${serp.meta.competitors_failed} blocked)` : ""}`,
      { size: 10 },
    );
    writeLine(`Search confidence: ${serp.search_confidence}`, {
      size: 10,
      gap: 12,
    });

    if (serp.ads.length > 0) {
      heading(`BIDDING ON THIS KEYWORD (${serp.ads.length})`);
      serp.ads.forEach((ad, i) => {
        writeLine(`${i + 1}. ${ad.advertiser} — ${ad.headline}`, {
          size: 10,
          bold: true,
          gap: 1,
        });
        writeLine(`   ${ad.url}`, { size: 9, gap: 1 });
        if (ad.snippet) writeLine(`   ${ad.snippet}`, { size: 9, gap: 6 });
        else y += 4;
      });
    }

    heading(`ORGANIC COMPETITORS (${serp.organic_competitors.length})`);
    serp.organic_competitors.forEach((c, i) => {
      writeLine(`${i + 1}. ${c.company} — ${c.title}`, {
        size: 10,
        bold: true,
        gap: 1,
      });
      writeLine(`   [${c.page_type.replace(/_/g, " ")}] ${c.url}`, {
        size: 9,
        gap: 1,
      });
      if (c.snippet) writeLine(`   ${c.snippet}`, { size: 9, gap: 6 });
      else y += 4;
    });

    heading("SWOT — COMPETITOR CLUSTER");
    const swotPairs: Array<[string, string[]]> = [
      ["Strengths (what most competitors do well)", serp.swot.strengths],
      ["Weaknesses (shared gaps across the cluster)", serp.swot.weaknesses],
      ["Opportunities (angles no competitor takes)", serp.swot.opportunities],
      ["Threats (hard-to-beat competitor moats)", serp.swot.threats],
    ];
    for (const [label, items] of swotPairs) {
      subheading(label);
      for (const item of items) writeLine(`• ${item}`, { size: 10, gap: 2 });
      y += 6;
    }

    heading("YOUR PAGE VS THE CLUSTER");
    subheading("Where you match or beat");
    writeLine(serp.your_page_position.vs_cluster_strengths, {
      size: 10,
      gap: 8,
    });
    subheading("Where you share the cluster's gaps");
    writeLine(serp.your_page_position.vs_cluster_gaps, {
      size: 10,
      gap: 8,
    });
    subheading("Differentiation themes you can own");
    serp.your_page_position.differentiation_themes.forEach((t, i) => {
      writeLine(`${i + 1}. ${t}`, { size: 10, gap: 4 });
    });
  }

  // ── Rewritten Page (if generated) ───────────────────────

  const safeTitle = (result.meta.page_title || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  doc.save(`cro-analysis-${safeTitle}-${Date.now()}.pdf`);
}
