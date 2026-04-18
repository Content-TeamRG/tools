import type { CriterionResult, ParsedContent } from './types';

const INTERROGATIVES = /^(what|how|why|when|which|is|are|can|should|who|where|does|do|will|would|has|have)\b/i;
const PREAMBLE_PATTERNS = /\b(in this article|in today'?s|in recent years|welcome to|this guide will|this post will|in this guide|by the end of|you'?ll learn)\b/i;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreA1(content: ParsedContent): CriterionResult {
  const h1 = content.h1;
  const pass = h1.includes('?') && INTERROGATIVES.test(h1);
  return {
    id: 'A1',
    label: 'H1 is a direct question',
    impact: 'critical',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `H1: "${h1}"`,
    fail_explanation: 'Your H1 is a topic label, not a question. AI engines match headings to user sub-queries. 78.4% of ChatGPT citations with questions come from headings. A topic label is never a sub-query match.',
    remediation: "Rewrite H1 as the exact question a user types into ChatGPT. E.g. 'What Is Variable Sales Compensation and How Does It Work?' Must contain a question mark and start with an interrogative word.",
  };
}

export function scoreA2(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasTldr = /\bTL;?DR\b/i.test(text) || /\btoo long.{0,10}didn'?t read\b/i.test(text);
  // Rough check: TL;DR block should appear in first 400 characters of text
  const first400 = text.slice(0, 400);
  const tldrInOpening = /\bTL;?DR\b/i.test(first400);
  const pass = hasTldr && tldrInOpening;
  return {
    id: 'A2',
    label: 'TL;DR block present and correctly structured',
    impact: 'high',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    fail_explanation: 'No TL;DR block detected under the H1. The TL;DR is the first chunk retrieved for the broadest queries. Without it, the article fails retrieval on the widest query surface.',
    remediation: 'Add a TL;DR block directly below the H1: one sentence under 25 words (starting with the focus keyword) + 2–4 bullet points. Total: 40–60 words.',
  };
}

export function scoreA3(content: ParsedContent): CriterionResult {
  const opening = content.opening_text;
  const openingWords = countWords(opening);
  const hasPreamble = PREAMBLE_PATTERNS.test(opening);
  const pass = openingWords <= 200 && !hasPreamble;
  return {
    id: 'A3',
    label: 'Opening ≤200 words with BLUF structure',
    impact: 'critical',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Opening word count: ${openingWords}. Preamble detected: ${hasPreamble}`,
    fail_explanation: 'The opening does not follow BLUF structure. 44.2% of citations come from the first 30% of a page. Scene-setting prose means the article fails retrieval for the highest-volume queries.',
    remediation: 'Restructure opening: (1) Sentence 1–2: Direct answer to H1 with primary keyword. (2) Sentence 3–4: Named, dated stat with source and link. (3) Sentence 5–6: Context. Delete all else. Hard limit: 200 words.',
  };
}

export function scoreA4(content: ParsedContent): CriterionResult {
  const h2s = content.h2s;
  if (h2s.length === 0) {
    return {
      id: 'A4',
      label: 'Every H2 is a question',
      impact: 'critical',
      section: 'A',
      points_awarded: 0,
      status: 'fail',
      details: 'No H2 headings found',
      fail_explanation: 'No H2 headings detected. H2s are how AI engines navigate and retrieve individual sections. Without them, the article has no retrievable sub-query structure.',
      remediation: "Rewrite every non-question H2 as a natural user query. Every H2 needs a question mark. E.g. 'Benefits and Drawbacks' → 'What Are the Pros and Cons of [Topic]?'",
    };
  }
  const nonQuestionH2s = h2s.filter((h) => !h.includes('?'));
  const pass = nonQuestionH2s.length === 0;
  return {
    id: 'A4',
    label: 'Every H2 is a question',
    impact: 'critical',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: nonQuestionH2s.length > 0 ? `Non-question H2s: ${nonQuestionH2s.slice(0, 3).map((h) => `"${h}"`).join(', ')}` : undefined,
    fail_explanation: `${nonQuestionH2s.length} of ${h2s.length} H2s are topic labels. In the RAG process, H2s function as AI's user prompts. A topic label is not a sub-query and will not be matched. 78.4% of citations with questions come from headings.`,
    remediation: "Rewrite every non-question H2: 'Benefits and Drawbacks' → 'What Are the Pros and Cons of [Topic]?'; 'Overview' → 'What Is [Topic] and How Does It Work?'",
  };
}

const PRONOUN_OPENERS = /^(it |this |there |the |they |these |those |its )/i;

export function scoreA5(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  if (sections.length === 0) {
    return {
      id: 'A5',
      label: 'Entity echoing on every H2 section',
      impact: 'high',
      section: 'A',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No sections found to evaluate entity echoing.',
      remediation: "Structure content with H2 headings. Ensure the first word of every H2 section paragraph is the main entity from that H2.",
    };
  }
  const failingSections = sections.filter((s) => {
    const firstPara = s.paragraphs[0] || '';
    return PRONOUN_OPENERS.test(firstPara);
  });
  const pass = failingSections.length === 0;
  return {
    id: 'A5',
    label: 'Entity echoing on every H2 section',
    impact: 'high',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: failingSections.length > 0 ? `Sections with weak openers: ${failingSections.slice(0, 2).map((s) => `"${s.heading}"`).join(', ')}` : undefined,
    fail_explanation: 'Entity echoing is missing. LLMs build a knowledge graph of entities. When a paragraph opens with "It is..." or "This means...", the entity mapping fails and the chunk is not reliably retrieved.',
    remediation: "Replace: 'It is a method that...' → '[Entity name] is a method that...'. Rule: H2 asks about X, first word of next paragraph is X.",
  };
}
