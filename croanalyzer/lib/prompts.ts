import type { PageContext } from "./types";
import { FRAMEWORK_RUBRIC } from "./framework";

export function buildExtractionSystem(): string {
  return `You analyze landing pages and extract a Page Profile in strict JSON.

The Page Profile is consumed by a downstream CRO analyzer that MUST ground its reasoning in the page's specific industry, ICP, voice, and terminology. Generic profiles produce generic analysis. Be specific.

Rules:
- Pull values from the page text. Do NOT invent.
- For unclear fields, write "unclear" rather than guessing.
- Industry: name the specific vertical, not just "B2B SaaS". Example specificity level: "B2B fintech / payment infrastructure for marketplaces".
- ICP: describe who the page is written for, including seniority and the problem they have, in the page's own framing.
- Terminology: 5-12 domain words the page actually uses (e.g., "settlement", "deal stage", "tenant"). Skip generic words.
- Voice tone: capture HOW it speaks ("measured-technical", "punchy-marketing", "academic-formal"), not just whether it's good.

Return JSON ONLY. No prose. No code fences.`;
}

export function buildExtractionUser(title: string, text: string): string {
  return `PAGE TITLE: ${title || "(none)"}

PAGE TEXT:
"""
${text}
"""

Output schema (JSON):
{
  "industry": string,
  "sub_vertical": string,
  "icp": string,
  "icp_seniority": string,
  "product_name": string,
  "product_category": string,
  "core_value_prop": string,
  "key_pain_points": string[],
  "voice_markers": {
    "tone": string,
    "formality": "formal" | "casual" | "mixed",
    "uses_jargon": boolean,
    "perspective": "we" | "you" | "third-person"
  },
  "terminology": string[],
  "competitor_mentions": string[],
  "social_proof_style": string,
  "pricing_model_signal": string
}`;
}

export type SystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export function buildScoringSystemBlocks(): SystemBlock[] {
  return [
    {
      type: "text",
      text: `# CRO FRAMEWORK RUBRIC — INTERNAL SCORING CRITERIA

The rubric below is the source of truth for HOW to score. It is INTERNAL.

ABSOLUTE GROUNDING RULES:
1. NEVER quote, paraphrase, or restate the rubric's example phrases in your output.
2. NEVER use the rubric's example CTAs, headlines, industries, or audiences as suggestions.
3. The rubric tells you WHAT TO SCORE. Your reasoning must be reconstructed from the user's page only.
4. If a candidate explanation could apply to any landing page, it is wrong — rewrite it using THIS page's specific industry, ICP, and product language.
5. If a rewrite suggestion does not name the page's product or use its terminology, rewrite it.

${FRAMEWORK_RUBRIC}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `# OUTPUT TASK

You will receive a Page Profile (extracted from the user's page) and the page sentences. For each sentence, score it. Then produce findings: high-impact issues that, if fixed, would meaningfully improve conversion for THIS specific audience.

Hard rules for grounding:
- Quote the user's actual sentence verbatim in every finding.
- "why_it_fails_for_this_audience" must reference at least one of: PageContext.industry, PageContext.icp, PageContext.product_name, PageContext.terminology.
- "rewrite_suggestion" must use the page's product name AND at least one piece of its terminology. Never use generic CTA phrases.
- If a sentence is fine, mark it "ok" and skip it from findings.
- Findings should be the 3-8 highest-leverage issues, not exhaustive.

Output budget rules (to stay within token limits):
- "one_line_reason": ≤ 100 chars.
- "one_line_diagnosis": ≤ 140 chars.
- "summary": 3-4 sentences, ≤ 500 chars total.
- "why_it_fails_for_this_audience": 1-2 sentences, ≤ 280 chars.
- "rewrite_explanation": 1 sentence, ≤ 200 chars.
- For "ok" sentences: still include them in sentence_scores, but leave rule_id as "" and one_line_reason as "".

Output JSON ONLY. No prose. No code fences. Schema:

{
  "overall_score": number,                    // 0-100, sum of all 6 module scores
  "score_label": "weak" | "moderate" | "strong",
  "summary": string,                          // 3-4 sentences. MUST reference PageContext.industry and PageContext.icp.
  "module_scores": [                          // exactly 6 entries, one per module
    {
      "id": "vp_messaging" | "cta" | "trust_social_proof" | "copy_readability" | "above_the_fold" | "form_friction",
      "name": string,                         // human-readable, e.g. "Value Proposition & Messaging"
      "score": number,                        // module score
      "max": number,                          // module max (24, 21, 18, 15, 14, 8 respectively)
      "one_line_diagnosis": string            // ≤ 140 chars, audience-grounded, names the biggest gap
    }
  ],
  "sentence_scores": [                        // only for sentences a copy-quality rule applies to (H1, subhead, CTA copy, VP claims, jargon, buzzwords). Skip pure body filler.
    {
      "id": number,
      "text": string,
      "score": "weak" | "mid" | "ok",
      "rule_id": string,                      // e.g. "vp.appeal", "cta.copy_quality", "atf.h1"
      "one_line_reason": string
    }
  ],
  "findings": [                               // 3-8 highest-leverage fixes
    {
      "rule_id": string,
      "severity": "high" | "medium" | "low",
      "original_sentence": string,
      "why_it_fails_for_this_audience": string,
      "rewrite_suggestion": string,
      "rewrite_explanation": string
    }
  ]
}`,
    },
  ];
}

export function buildScoringUser(
  pc: PageContext,
  sentences: { id: number; text: string }[],
): string {
  return `PAGE PROFILE (use this to ground every explanation):
${JSON.stringify(pc, null, 2)}

PAGE SENTENCES (id-keyed, in order):
${JSON.stringify(sentences, null, 2)}

Apply the framework rubric. Return JSON only.`;
}
