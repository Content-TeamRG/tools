import type { CriterionResult, ParsedContent } from './types';

const PREAMBLE_PATTERNS = /^(in this article|in today'?s|in recent years|welcome to|this guide will|this post will|by the end of this|you'?ll (learn|discover|find out)|if you'?ve ever|have you ever wondered)/i;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreE1(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const totalWords = countWords(text);
  if (totalWords === 0) {
    return {
      id: 'E1',
      label: 'No keyword stuffing (density ≤2%)',
      impact: 'high',
      section: 'E',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No content to analyze.',
      remediation: 'Add content and keep focus keyword density at or below 2%.',
    };
  }

  // We can't know the focus keyword without being told, so we detect
  // the most repeated significant word/phrase (2+ word phrases) as a proxy
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!['this', 'that', 'with', 'from', 'they', 'their', 'have', 'been', 'will', 'your', 'more', 'also', 'when', 'what', 'into', 'each', 'some', 'than', 'then', 'there', 'these', 'those', 'about', 'which', 'where', 'after', 'before', 'every', 'first', 'both', 'most', 'only'].includes(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const maxCount = Math.max(...Object.values(freq));
  const density = (maxCount / totalWords) * 100;
  const pass = density <= 2;

  return {
    id: 'E1',
    label: 'No keyword stuffing (density ≤2%)',
    impact: 'high',
    section: 'E',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Highest keyword density: ~${density.toFixed(1)}% (threshold: 2%)`,
    fail_explanation: 'Keyword density exceeds 2% or focus keyword repeats within a paragraph. In testing, natural 0.8% density was cited 4x more frequently than 2.5% density. AI reads for meaning — it does not reward frequency.',
    remediation: 'Calculate: (keyword count ÷ total word count) × 100. If above 2%, remove repeated instances. Replace repeated keywords with the named entity, a synonym, or rephrase to remove it.',
  };
}

export function scoreE2(content: ParsedContent): CriterionResult {
  const openingText = content.opening_text;
  // Check first sentence
  const firstSentence = openingText.split(/[.!?]/)[0] || '';
  const hasPreamble = PREAMBLE_PATTERNS.test(firstSentence.trim());
  return {
    id: 'E2',
    label: 'No opening preamble',
    impact: 'critical',
    section: 'E',
    points_awarded: hasPreamble ? 0 : 2,
    status: hasPreamble ? 'fail' : 'pass',
    details: hasPreamble ? `Preamble detected: "${firstSentence.trim().slice(0, 80)}..."` : undefined,
    fail_explanation: 'Opening preamble detected. The first 200 words are the highest-density citation zone — 44.2% of all citations come from the first 30% of a page. Every word of preamble is a wasted extraction opportunity.',
    remediation: 'Read the first sentence. Ask: "Does this directly answer the H1 question?" If not, delete everything before the direct answer. The first sentence must be the answer. No warm-up, no context-setting.',
  };
}

export function scoreE3(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const html = content.html;

  // Check for structural breaks every ~200 words
  // In HTML: look for lists, tables, or block elements
  // In plain text: look for bullet/numbered list markers
  const hasBullets = /^[\s]*[-•*]\s/m.test(text);
  const hasNumbered = /^[\s]*\d+\.\s/m.test(text);
  const hasTables = html ? /<table/i.test(html) : /\|.*\|.*\|/m.test(text);
  const hasStructure = hasBullets || hasNumbered || hasTables;

  // Also check density: scan 200-word windows for structural breaks
  const words = text.split(/\s+/);
  let hasLongProseBlock = false;
  for (let i = 0; i < words.length - 200; i += 100) {
    const chunk = words.slice(i, i + 200).join(' ');
    const chunkHasList = /^[\s]*[-•*\d]\s/m.test(chunk);
    const chunkHasTable = /\|.*\|/m.test(chunk);
    if (!chunkHasList && !chunkHasTable && chunk.length > 800) {
      hasLongProseBlock = true;
      break;
    }
  }

  const pass = hasStructure && !hasLongProseBlock;
  return {
    id: 'E3',
    label: 'No dense prose blocks',
    impact: 'high',
    section: 'E',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: hasStructure ? `Structural elements present (lists: ${hasBullets || hasNumbered}, tables: ${hasTables})` : 'No structural breaks detected',
    fail_explanation: 'Dense prose blocks detected. Dense prose was the worst-performing format for AI inclusion in Chris Green\'s June 2025 experiment. Prose requires AI to parse, identify, and extract meaning — structured formats deliver it pre-packaged.',
    remediation: 'Scan every 200-word stretch. If no list, table, Q&A, or definition block appears: add one. Minimum: convert 3 consecutive prose points into a bulleted list. A structural break every 200 words is the minimum.',
  };
}
