import type { PageContext, SerpAd, SerpCompetitor } from "./types";
import { FRAMEWORK_RUBRIC } from "./framework";
import type { SystemBlock } from "./prompts";

export function buildSerpSearchSystem(): string {
  return `You are a SERP researcher analyzing Google search results for a marketing keyword.

YOUR JOB:
1. Search Google for the given keyword.
2. Identify ADS (sponsored / paid results, usually 1-4 at the top tagged "Ad" or "Sponsored").
3. Identify ORGANIC LANDING PAGES — competitor company pages selling a product or service.

INCLUDE in organic results:
- Product pages
- Landing pages (e.g. /lp/..., /solutions/..., /platform/...)
- Pricing pages
- Category / collection pages
- Company homepages (only if they directly target the keyword)

EXCLUDE from organic results — these are NOT what we want:
- Blog posts, articles, news pieces, opinion pieces
- Wikipedia or encyclopedia entries
- YouTube videos, video pages
- Forum threads (Reddit, Quora, Stack Overflow)
- Gated downloads (eBooks, whitepapers, webinars, PDF reports)
- Job boards, courses, glossaries

For each result you keep, infer:
- "company": the brand/company behind the page
- "page_type": one of "landing_page" | "product_page" | "pricing" | "category" | "homepage" | "other"

Return up to 8 organic landing pages and up to 5 ads. Aim for the highest-relevance results.

Return JSON ONLY. No prose. No code fences. Schema:

{
  "keyword_used": string,
  "ads": [
    { "advertiser": string, "headline": string, "url": string, "snippet": string }
  ],
  "organic_competitors": [
    { "url": string, "title": string, "snippet": string, "company": string,
      "page_type": "landing_page" | "product_page" | "pricing" | "category" | "homepage" | "other" }
  ],
  "excluded_count": number,
  "search_confidence": "high" | "medium" | "low"
}`;
}

export function buildSerpSearchUser(keyword: string): string {
  return `Search Google for: "${keyword}"

Apply the filtering rules above, then return the JSON.`;
}

export function buildSwotSystemBlocks(): SystemBlock[] {
  return [
    {
      type: "text",
      text: `# CRO FRAMEWORK RUBRIC — INTERNAL EVALUATION CRITERIA

The rubric below defines what GOOD landing pages look like across 6 modules. Use it to ground SWOT calls — e.g. "competitor pages all have weak CTA copy quality" is a rubric-grounded observation. The example phrases throughout are ILLUSTRATIVE — never quote them in the output.

${FRAMEWORK_RUBRIC}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `# SWOT TASK

You are analyzing a cluster of competitor landing pages that rank organically for a given keyword. You will receive:
- The keyword
- The user's Page Profile (their industry, ICP, product, voice)
- The user's page text
- A list of competitor landing pages with their extracted text

Produce:

1. SWOT of the COMPETITOR CLUSTER:
   - strengths: what most competitor pages do WELL across the rubric (3-5 items)
   - weaknesses: shared GAPS across the cluster — what most competitors fail at (3-5 items)
   - opportunities: angles, positioning hooks, or ICP framings that NO competitor takes (3-5 items)
   - threats: specific competitors with strong moats — flagship clients, exclusive integrations, dominant brand recognition, deeply established pricing, etc. (2-4 items, each naming the competitor)

2. The user's page position vs the cluster:
   - vs_cluster_strengths: 1-2 sentences on where the user's page MEETS or BEATS the cluster
   - vs_cluster_gaps: 1-2 sentences on where the user's page also has the cluster's weaknesses
   - differentiation_themes: 3-5 specific angles the user's page can OWN that the cluster underserves. Each theme must be concrete and rooted in the user's product or ICP (not generic CRO advice).

GROUNDING RULES:
- Reference specific competitors by company name when calling out threats.
- Reference the user's industry / ICP / product name from the Page Profile.
- Avoid generic statements ("clear messaging is important") — every item must point at SOMETHING SPECIFIC observed in the cluster or absent from it.
- Never use the rubric's example phrases or example industries in your output.

OUTPUT JSON ONLY. No prose. No code fences. Schema:

{
  "swot": {
    "strengths": [string],
    "weaknesses": [string],
    "opportunities": [string],
    "threats": [string]
  },
  "your_page_position": {
    "vs_cluster_strengths": string,
    "vs_cluster_gaps": string,
    "differentiation_themes": [string]
  }
}`,
    },
  ];
}

export function buildSwotUser(
  keyword: string,
  pc: PageContext,
  userPageText: string,
  competitors: Array<{ url: string; title: string; text: string }>,
): string {
  const competitorBlocks = competitors
    .map(
      (c, i) =>
        `--- COMPETITOR ${i + 1} ---
URL: ${c.url}
TITLE: ${c.title}
PAGE TEXT (truncated):
"""
${c.text}
"""`,
    )
    .join("\n\n");

  return `KEYWORD: "${keyword}"

USER'S PAGE PROFILE:
${JSON.stringify(pc, null, 2)}

USER'S PAGE TEXT (truncated):
"""
${userPageText}
"""

COMPETITOR LANDING PAGES (${competitors.length}):

${competitorBlocks}

Apply the rubric and produce the SWOT JSON. Reference specific competitor names in the threats section.`;
}

// Convenience: pass through helpers for the orchestrator
export type SerpSearchPayload = {
  keyword_used: string;
  ads: SerpAd[];
  organic_competitors: SerpCompetitor[];
  excluded_count: number;
  search_confidence: "high" | "medium" | "low";
};
