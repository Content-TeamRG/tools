import type { CriterionResult, ScoreReport, PriorityAction, SectionScore, ContentMetadata } from './types';
import type { ParsedContent } from './types';
import { scoreA1, scoreA2, scoreA3, scoreA4, scoreA5 } from './section-a';
import { scoreB1, scoreB2, scoreB3, scoreB4, scoreB5, scoreB6 } from './section-b';
import { scoreC1, scoreC2, scoreC3, scoreC4, scoreC5, scoreC6, scoreC7 } from './section-c';
import { scoreD1, scoreD2, scoreD3, scoreD4, scoreD5, scoreD6, scoreD7 } from './section-d';
import { scoreE1, scoreE2, scoreE3 } from './section-e';
import { scoreF1, scoreF2, scoreF3 } from './section-f';

const SECTION_LABELS: Record<string, string> = {
  A: 'Opening & Structure',
  B: 'Section Quality',
  C: 'Writing Quality',
  D: 'Content Formats',
  E: 'Failure Patterns',
  F: 'Technical & Schema',
};

function gradeFromScore(score: number): { grade: 'A' | 'B' | 'C' | 'D'; label: string } {
  if (score >= 37) return { grade: 'A', label: 'Citation-ready' };
  if (score >= 30) return { grade: 'B', label: 'Strong' };
  if (score >= 20) return { grade: 'C', label: 'Needs work' };
  return { grade: 'D', label: 'Not citation-ready' };
}

function buildSectionScores(results: CriterionResult[]): SectionScore[] {
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  return sections.map((section) => {
    const sectionResults = results.filter((r) => r.section === section);
    const score = sectionResults.reduce((sum, r) => sum + r.points_awarded, 0);
    const maxScore = sectionResults.length * 2;
    const passed = sectionResults.filter((r) => r.status === 'pass').length;
    return {
      section,
      label: SECTION_LABELS[section],
      score,
      max_score: maxScore,
      passed,
      total: sectionResults.length,
    };
  });
}

function buildPriorityActions(results: CriterionResult[]): PriorityAction[] {
  const failed = results.filter((r) => r.status === 'fail');
  const order = { critical: 0, high: 1, medium: 2 };
  return failed
    .sort((a, b) => order[a.impact] - order[b.impact])
    .map((r) => ({
      id: r.id,
      label: r.label,
      impact: r.impact,
      remediation: r.remediation || '',
      fail_explanation: r.fail_explanation || '',
    }));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildMetadata(content: ParsedContent): ContentMetadata {
  const sentences = content.sentences;
  const longSentences = sentences
    .filter((s) => countWords(s) > 20)
    .slice(0, 5)
    .map((s) => ({ text: s, words: countWords(s) }));

  const avgSentenceLength =
    sentences.length > 0
      ? Math.round(sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length)
      : 0;

  // Keyword density: most frequent significant word
  const words = content.full_text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  const stopWords = new Set(['this', 'that', 'with', 'from', 'they', 'their', 'have', 'been', 'will', 'your', 'more', 'also', 'when', 'what', 'into', 'each', 'some', 'than', 'then', 'there', 'these', 'those', 'about', 'which', 'where', 'after', 'before', 'every', 'first', 'both', 'most', 'only', 'very', 'just', 'such', 'even', 'back', 'well', 'still', 'here', 'come', 'make', 'like', 'time', 'look', 'know', 'take', 'good', 'much']);
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  const maxCount = Object.values(freq).length > 0 ? Math.max(...Object.values(freq)) : 0;
  const keywordDensity = content.word_count > 0 ? parseFloat(((maxCount / content.word_count) * 100).toFixed(1)) : 0;

  return {
    word_count: content.word_count,
    sentence_count: sentences.length,
    h1: content.h1,
    h2_count: content.h2s.length,
    paragraph_count: content.paragraphs.length,
    has_faq: content.faq_items.length > 0 || /\bFAQ\b|frequently asked questions?/i.test(content.full_text),
    has_schema: content.schema_types.length > 0,
    keyword_density: keywordDensity,
    avg_sentence_length: avgSentenceLength,
    long_sentences: longSentences,
  };
}

export function scoreContent(content: ParsedContent, url: string = '', title?: string): ScoreReport {
  const results: CriterionResult[] = [
    scoreA1(content),
    scoreA2(content),
    scoreA3(content),
    scoreA4(content),
    scoreA5(content),
    scoreB1(content),
    scoreB2(content),
    scoreB3(content),
    scoreB4(content),
    scoreB5(content),
    scoreB6(content),
    scoreC1(content),
    scoreC2(content),
    scoreC3(content),
    scoreC4(content),
    scoreC5(content),
    scoreC6(content),
    scoreC7(content),
    scoreD1(content),
    scoreD2(content),
    scoreD3(content),
    scoreD4(content),
    scoreD5(content),
    scoreD6(content),
    scoreD7(content),
    scoreE1(content),
    scoreE2(content),
    scoreE3(content),
    scoreF1(content),
    scoreF2(content),
    scoreF3(content),
  ];

  const totalScore = results.reduce((sum, r) => sum + r.points_awarded, 0);
  const maxScore = results.length * 2;
  const { grade, label: grade_label } = gradeFromScore(totalScore);

  const criticalFailures = results
    .filter((r) => r.impact === 'critical' && r.status === 'fail')
    .map((r) => r.id);

  const isPublishable = totalScore >= 30 && criticalFailures.length === 0;

  return {
    content_url: url,
    content_title: title || content.h1,
    scored_at: new Date().toISOString(),
    total_score: totalScore,
    max_score: maxScore,
    grade,
    grade_label,
    criteria_passed: results.filter((r) => r.status === 'pass').length,
    criteria_failed: results.filter((r) => r.status === 'fail').length,
    critical_failures: criticalFailures,
    is_publishable: isPublishable,
    results,
    priority_actions: buildPriorityActions(results),
    section_scores: buildSectionScores(results),
    metadata: buildMetadata(content),
  };
}
