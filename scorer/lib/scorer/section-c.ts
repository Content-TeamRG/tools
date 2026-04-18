import type { CriterionResult, ParsedContent } from './types';

const VAGUE_TIME = /\b(recently|in recent years|nowadays|in today'?s (world|landscape|market|era|age)|modern(ly)?|lately|these days|current trends?|at present|currently trending)\b/i;
const VAGUE_ATTRIBUTION = /\b(studies show|research (shows|indicates|suggests|finds)|experts (agree|say|recommend|believe)|it is (widely |commonly |generally )?(known|accepted|believed|understood)|many companies|industry (experts|leaders|analysts)|sources say|according to (some|many|most) (experts|researchers|analysts))\b/i;
const GENERIC_ENTITIES = /\b(the platform|this tool|this approach|the company|the study|industry leaders|our method(ology)?|the solution|this software|the system|this process|the product)\b/i;

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreC1(content: ParsedContent): CriterionResult {
  const sentences = content.sentences;
  const longSentences = sentences.filter((s) => countWords(s) > 20);
  const pass = longSentences.length === 0;
  const pct = sentences.length > 0 ? Math.round((longSentences.length / sentences.length) * 100) : 0;
  return {
    id: 'C1',
    label: 'All sentences ≤20 words',
    impact: 'medium',
    section: 'C',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `${longSentences.length} sentences exceed 20 words (${pct}% of total)`,
    fail_explanation: 'Sentences exceed 20 words in one or more sections. Cited content averages Flesch-Kincaid grade 16; uncited content averages grade 19. Long sentences embed meaning in context that RAG systems cannot reliably extract in isolation.',
    remediation: "Run content through Hemingway App. Flag every sentence over 20 words. Split at the first conjunction: 'and', 'but', 'which', 'that', 'because'. One clause = one sentence.",
  };
}

export function scoreC2(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasVagueAttribution = VAGUE_ATTRIBUTION.test(text);
  const matches = text.match(VAGUE_ATTRIBUTION);
  // Also check: does it have any stats at all with proper attribution?
  const hasProperStat = /according to [A-Z][a-zA-Z\s]+,?\s+\d{4}/i.test(text) ||
    /\d+(\.\d+)?%[^.]*\([A-Z][a-zA-Z\s]+,?\s+\d{4}\)/i.test(text);

  const pass = !hasVagueAttribution && hasProperStat;
  return {
    id: 'C2',
    label: 'Every stat has named source + year + link',
    impact: 'critical',
    section: 'C',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: matches ? `Vague attribution found: "${matches[0]}"` : (hasProperStat ? 'Proper attribution detected' : 'No properly attributed stats found'),
    fail_explanation: 'Vague attribution detected. Named, attributed statistics increased citation rates by 41% in a 50-article test (Atlas Marketing). Vague attribution fails the verifiability check — the claim cannot be confirmed, so the chunk is deprioritised.',
    remediation: "Search for: 'studies show', 'research indicates', 'experts agree'. Replace each with: 'According to [Named Source] [Year], [specific number or finding]' and link directly to the primary study.",
  };
}

export function scoreC3(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const wordCount = countWords(text);
  // Count attributed stats: "X% (Source, Year)" or "According to Source Year"
  const statMatches = text.match(/\d+(\.\d+)?%|\b\d{1,3}(,\d{3})+\b|\b\d+ (million|billion|thousand)\b/gi) || [];
  const requiredStats = Math.floor(wordCount / 175);
  const pass = statMatches.length >= requiredStats;
  return {
    id: 'C3',
    label: 'One attributed stat every 150–200 words',
    impact: 'high',
    section: 'C',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Found ~${statMatches.length} stats, need ~${requiredStats} for ${wordCount} words`,
    fail_explanation: 'Stat density is below the required threshold. Stat density is a chunk quality signal — each named stat is a verifiable anchor point. Sections without stats are cited less frequently.',
    remediation: `Divide total word count (${wordCount}) by 175 = minimum ${requiredStats} attributed stats required. Map one stat per word-count interval across the full article — not clustered at the top.`,
  };
}

export function scoreC4(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasVagueTime = VAGUE_TIME.test(text);
  const matches = text.match(VAGUE_TIME);
  return {
    id: 'C4',
    label: 'No vague time language',
    impact: 'medium',
    section: 'C',
    points_awarded: hasVagueTime ? 0 : 2,
    status: hasVagueTime ? 'fail' : 'pass',
    details: matches ? `Found: "${matches[0]}"` : undefined,
    fail_explanation: "Vague time language detected. Pages using vague time language are 3x more likely to lose AI citations over time compared to pages with specific dated claims. 'Recently' could mean last week or five years ago — AI cannot use it as a recency signal.",
    remediation: "Search for: 'recently', 'lately', 'in recent years', 'nowadays', 'these days'. Replace with specific date: 'As of Q1 2025...', 'Since January 2024...'. If you don't know the specific date, remove the claim.",
  };
}

export function scoreC5(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasGenericEntities = GENERIC_ENTITIES.test(text);
  const matches = text.match(GENERIC_ENTITIES);
  return {
    id: 'C5',
    label: 'Named entities used on every reference',
    impact: 'high',
    section: 'C',
    points_awarded: hasGenericEntities ? 0 : 2,
    status: hasGenericEntities ? 'fail' : 'pass',
    details: matches ? `Generic reference found: "${matches[0]}"` : undefined,
    fail_explanation: 'Generic entity references detected. LLMs build a knowledge graph of entities. When content uses "the platform" instead of "Salesforce", the entity mapping fails — the chunk is not retrieved for queries about that entity.',
    remediation: "Search for: 'the platform', 'this tool', 'this approach', 'the company', 'the study'. Replace every instance with the specific named entity. Never use a pronoun where the entity name fits.",
  };
}

export function scoreC6(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  // Original data: own test, case study with numbers, or named proprietary framework
  const hasOriginalData =
    /we (tested|analyzed|surveyed|studied|ran|measured|tracked|found|discovered)[^.]*\d+/i.test(text) ||
    /our (test|study|analysis|research|experiment|case study|data)[^.]*\d+/i.test(text) ||
    /client[^.]*went from[^.]*\d+[^.]*to[^.]*\d+/i.test(text) ||
    /case study[^.]*\d+/i.test(text) ||
    /proprietary|our (method|framework|model|approach|process|system)/i.test(text);

  return {
    id: 'C6',
    label: 'At least one original data point',
    impact: 'critical',
    section: 'C',
    points_awarded: hasOriginalData ? 2 : 0,
    status: hasOriginalData ? 'pass' : 'fail',
    fail_explanation: 'No original data point detected. LLMs have read the 500th generic guide on most topics. Content that only references what already exists gives AI no reason to cite it over a more authoritative source.',
    remediation: "Add one of: (1) A test result — 'We tested this across 50 articles and found 67% improvement.' (2) A client case study — 'Client X went from 550 to 2,300 AI-referred trials in 4 weeks.' (3) A named proprietary framework.",
  };
}

export function scoreC7(content: ParsedContent): CriterionResult {
  const paragraphs = content.paragraphs;
  if (paragraphs.length === 0) {
    return {
      id: 'C7',
      label: 'All paragraphs 2–3 sentences, one idea each',
      impact: 'medium',
      section: 'C',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No paragraphs detected.',
      remediation: 'Structure content into short 2–3 sentence paragraphs, each containing one distinct idea.',
    };
  }
  const longParas = paragraphs.filter((p) => {
    const sentences = splitSentences(p);
    return sentences.length > 3;
  });
  const pass = longParas.length === 0;
  return {
    id: 'C7',
    label: 'All paragraphs 2–3 sentences, one idea each',
    impact: 'medium',
    section: 'C',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `${longParas.length}/${paragraphs.length} paragraphs exceed 3 sentences`,
    fail_explanation: 'Paragraphs exceeding 3 sentences detected. Long paragraphs create fewer clean extraction points for RAG systems. Each paragraph should represent one complete, extractable idea.',
    remediation: "Scan every paragraph. Any paragraph over 3 sentences: identify the second idea and split at that point. Each paragraph = one idea, 2–3 sentences. Do not start split paragraphs with 'It', 'This', or 'They'.",
  };
}
