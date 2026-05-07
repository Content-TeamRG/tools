import type {
  Finding,
  PageContext,
  RewriteMode,
  RewriteSerpInput,
  SentenceScore,
} from "./types";
import { FRAMEWORK_RUBRIC } from "./framework";
import type { SystemBlock } from "./prompts";

export function buildRewriteSystemBlocks(mode: RewriteMode): SystemBlock[] {
  const modeContract =
    mode === "mistakes"
      ? `MODE: FIX MISTAKES ONLY.
- Apply the explicit rewrite_suggestion for each finding.
- Apply the rubric to fix the additional weak/mid sentences.
- Do NOT change strategic positioning, hero claim, or value prop unless a finding explicitly says to.
- Goal: same page, fixed copy.`
      : mode === "serp"
        ? `MODE: APPLY SERP POSITIONING ONLY.
- Do NOT fix individual copy mistakes from a CRO scoring pass — those are out of scope here.
- Reframe the page (especially the hero, value prop, and core benefit lines) to lean into the differentiation themes the SERP analysis surfaced.
- Strengthen positioning where the competitor cluster is weak (cluster_weaknesses) and where no one else is playing (swot_opportunities).
- Goal: same page, sharper positioning vs the competitive cluster.`
        : `MODE: FIX MISTAKES + APPLY SERP POSITIONING.
- Apply both layers in one rewrite.
- Apply the explicit rewrite_suggestion for each finding and fix weak/mid sentences using the rubric.
- Reframe the hero, value prop, and any positioning copy to lean into the SERP differentiation themes and cluster opportunities.
- Goal: best-quality page that fixes copy AND sharpens positioning.`;

  return [
    {
      type: "text",
      text: `# CRO FRAMEWORK RUBRIC — INTERNAL REWRITE GUIDE

The rubric below tells you what GOOD copy looks like under each module. Use it as the standard the rewrite must meet. The example phrases are ILLUSTRATIVE — never quote them, paraphrase them, or use them in the rewrite. The rewrite must use the page's own product, terminology, and audience language.

${FRAMEWORK_RUBRIC}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `# REWRITE TASK

You are rewriting a landing page so that it would score significantly higher on the rubric above AND/OR position more sharply against the competitive cluster, depending on the MODE specified below.

${modeContract}

HARD RULES (apply to all modes, non-negotiable):

1. PRESERVE FACTS. Do not invent statistics, customer counts, country numbers, awards, named clients, pricing, currencies, or any other claim not present in the original page text or Page Profile. If you don't see a fact in the source, do not include one.

2. PRESERVE STRUCTURE. Keep the same logical flow as the original — hero, features/value props, social proof, pricing, FAQ, footer-relevant — in the same order. Do not reorder sections.

3. APPLY EXPLICIT REWRITES. (Mistakes & Both modes only) For each finding with a rewrite_suggestion, replace the original_sentence with the suggestion. If the suggestion is a structural instruction (e.g., "consolidate to one primary CTA"), interpret the intent.

4. APPLY THE RUBRIC. (Mistakes & Both modes only) For weak/mid sentences without an explicit rewrite, fix the rule the rule_id points to, using the Page Profile's product_name and terminology.

5. APPLY SERP POSITIONING. (SERP & Both modes only) For each differentiation theme, weave it into the page where it naturally fits — especially the hero, value prop, and core benefit lines. For each cluster weakness or opportunity, add or rewrite copy that explicitly addresses what competitors miss. Use the page's own terminology, not jargon from the SERP results.

6. VOICE MATCH. Maintain the tone described in PageContext.voice_markers.tone, the formality level, and the perspective (we / you / third-person).

7. NO RUBRIC LEAKAGE. Never use the rubric's example phrases, example CTAs, or example industries in the output.

8. NO COMPETITOR LEAKAGE. Never name a competitor by name in the rewritten copy. Use insights from the SERP analysis to inform positioning, but the rewrite is for the user's own page.

9. SMOOTH PROSE. Rewritten sentences must connect cleanly to the surrounding sentences. The output should read like a finished page, not a patchwork.

OUTPUT FORMAT — strict JSON, no prose, no code fences:

{
  "rewritten_text": string,                  // The full rewritten page in plain prose. Use \\n\\n between logical sections. No markdown headings or bullets unless the original had them.
  "change_log": [                             // 5-15 substantive before -> after pairs
    {
      "before": string,                       // exact original sentence (or short phrase summarising a structural change)
      "after": string,                        // your rewritten version
      "reason": string                        // 1 sentence, ≤ 200 chars, audience-grounded
    }
  ],
  "applied_findings_count": number            // count of findings/weak-sentences/SERP-themes you actually addressed
}`,
    },
  ];
}

export function buildRewriteUser(
  mode: RewriteMode,
  pc: PageContext,
  originalText: string,
  findings: Finding[],
  weakSentences: SentenceScore[],
  serp: RewriteSerpInput | undefined,
  pageTitle: string,
): string {
  const includeMistakes = mode === "mistakes" || mode === "both";
  const includeSerp = (mode === "serp" || mode === "both") && !!serp;

  const findingsBlock =
    includeMistakes && findings.length > 0
      ? findings
          .map(
            (f, i) => `${i + 1}. [${f.severity} · ${f.rule_id}]
   Original: "${f.original_sentence}"
   Rewrite to: "${f.rewrite_suggestion}"
   Why: ${f.why_it_fails_for_this_audience}`,
          )
          .join("\n\n")
      : "";

  const weakBlock =
    includeMistakes && weakSentences.length > 0
      ? weakSentences
          .map(
            (s, i) =>
              `${i + 1}. [${s.score} · ${s.rule_id || "unspecified"}] "${s.text}"
   Issue: ${s.one_line_reason || "see rubric"}`,
          )
          .join("\n\n")
      : "";

  const serpBlock = includeSerp
    ? `KEYWORD: "${serp!.keyword}"

DIFFERENTIATION THEMES TO LEAN INTO (the user's page can own these — competitors don't):
${serp!.differentiation_themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

CLUSTER OPPORTUNITIES (angles no competitor takes — exploit these):
${serp!.swot_opportunities.map((t, i) => `${i + 1}. ${t}`).join("\n")}

CLUSTER WEAKNESSES (gaps every competitor shares — explicitly address these):
${serp!.swot_weaknesses.map((t, i) => `${i + 1}. ${t}`).join("\n")}

CONTEXT — your page vs the cluster:
- Where the user's page already meets/beats the cluster: ${serp!.vs_cluster_strengths}
- Where the user's page shares the cluster's gaps: ${serp!.vs_cluster_gaps}`
    : "";

  const sections: string[] = [];
  sections.push(`PAGE TITLE: ${pageTitle || "(untitled)"}`);
  sections.push(
    `PAGE PROFILE (ground every rewrite in this):\n${JSON.stringify(pc, null, 2)}`,
  );
  sections.push(`ORIGINAL PAGE TEXT:\n"""\n${originalText}\n"""`);

  if (includeMistakes) {
    sections.push(
      `EXPLICIT REWRITE TARGETS (apply each suggestion verbatim or close to it):\n${
        findingsBlock || "(no findings)"
      }`,
    );
    sections.push(
      `ADDITIONAL WEAK / MID SENTENCES (no explicit rewrite — apply the rubric):\n${
        weakBlock || "(none)"
      }`,
    );
  }

  if (includeSerp) {
    sections.push(`SERP COMPETITIVE INPUT:\n${serpBlock}`);
  }

  sections.push(
    `Now produce the JSON output in MODE = ${mode}. Remember: preserve facts, preserve structure, preserve voice, never invent.`,
  );

  return sections.join("\n\n");
}
