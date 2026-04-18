import type { CriterionResult, ParsedContent } from './types';

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot'];

export function scoreF1(content: ParsedContent): CriterionResult {
  const schemaTypes = content.schema_types;
  const hasArticle = schemaTypes.some((t) => ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].includes(t));
  const hasFaqPage = schemaTypes.some((t) => t === 'FAQPage');
  const hasHowTo = schemaTypes.some((t) => t === 'HowTo');

  // Also check in raw HTML for JSON-LD
  const html = content.html;
  const hasArticleInHtml = html ? /"@type"\s*:\s*"(Article|BlogPosting|NewsArticle|TechArticle)"/i.test(html) : false;
  const hasFaqInHtml = html ? /"@type"\s*:\s*"FAQPage"/i.test(html) : false;

  const hasArticleSchema = hasArticle || hasArticleInHtml;
  const hasFaqSchema = hasFaqPage || hasFaqInHtml;

  const details: string[] = [];
  details.push(`Article schema: ${hasArticleSchema ? '✓' : '✗'}`);
  details.push(`FAQPage schema: ${hasFaqSchema ? '✓' : '✗'}`);
  details.push(`HowTo schema: ${hasHowTo ? '✓' : 'N/A'}`);

  const pass = hasArticleSchema && hasFaqSchema;
  return {
    id: 'F1',
    label: 'Article + FAQPage + HowTo schema implemented',
    impact: 'critical',
    section: 'F',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: details.join(' | '),
    fail_explanation: 'Schema markup is missing or invalid. FAQPage schema achieves a 41% citation rate versus 15% without it — a 2.7x lift. HowTo schema is extracted directly by voice assistants. Missing schema means structured content is treated as plain prose.',
    remediation: 'Implement: (1) Article schema on every post. (2) FAQPage schema wrapping the entire FAQ section. (3) HowTo schema wrapping every numbered step sequence. Validate all at search.google.com/test/rich-results.',
  };
}

export function scoreF2(content: ParsedContent): CriterionResult {
  const html = content.raw_html;

  // Check for AI bot allowances — this requires robots.txt which we don't have in article content
  // We check the page for meta robots tags and JS-rendering indicators
  const hasMetaRobotsBlock = html ? /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) : false;
  const hasContentInHtml = html ? html.length > 500 : true; // proxy for SSR vs JS-rendered

  // For URL-based analysis, we assume AI bots allowed unless blocked
  // We can only flag if meta robots noindex detected
  const pass = !hasMetaRobotsBlock && hasContentInHtml;
  return {
    id: 'F2',
    label: 'AI bots allowed in robots.txt; content in raw HTML',
    impact: 'high',
    section: 'F',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Meta robots block: ${hasMetaRobotsBlock ? 'detected' : 'none'}. HTML content: ${hasContentInHtml ? 'present' : 'missing'}`,
    fail_explanation: 'One or more AI crawlers may be blocked or content is JS-rendered. A blocked crawler cannot index or cite the content. JS-rendered content is frequently missed by AI crawlers that do not execute JavaScript.',
    remediation: `Check robots.txt for all 5 bots: ${AI_BOTS.join(', ')}. Add any missing. View page source (Ctrl+U) — if article body text doesn't appear in raw HTML, move to server-side rendering. Run PageSpeed Insights for Core Web Vitals.`,
  };
}

export function scoreF3(content: ParsedContent): CriterionResult {
  const text = content.full_text;

  // Check for visible "Last updated" date
  const hasLastUpdated = /last updated[:\s]+\w+\s+\d{4}|updated[:\s]+\w+\s+\d{4}|published[:\s]+\w+\s+\d{4}/i.test(text);
  // Check for llms.txt reference (would be on the website, not in article body)
  // We can only check if mentioned in content
  const hasLlmsTxt = /llms\.txt/i.test(text);

  const pass = hasLastUpdated;
  return {
    id: 'F3',
    label: "Visible 'Last updated' date + 30-day refresh + llms.txt",
    impact: 'high',
    section: 'F',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Last updated visible: ${hasLastUpdated ? 'yes' : 'no'}. llms.txt mentioned: ${hasLlmsTxt ? 'yes' : 'no'}`,
    fail_explanation: "Visible date or refresh process missing. 76.4% of ChatGPT's most-cited pages were updated within the past 30 days (Atlas Marketing, 200-article test). Content older than 90 days without updates loses citation rates by more than half.",
    remediation: "Add 'Last updated: [Month Year]' as visible text on the page — in the byline, header, or opening section. Not just in CMS metadata. Set a 30-day calendar reminder. Add this page's URL to llms.txt at the root domain.",
  };
}
