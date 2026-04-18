export type ImpactLevel = 'critical' | 'high' | 'medium';
export type CriterionStatus = 'pass' | 'fail';
export type Grade = 'A' | 'B' | 'C' | 'D';

export interface CriterionResult {
  id: string;
  label: string;
  impact: ImpactLevel;
  section: string;
  points_awarded: number;
  status: CriterionStatus;
  fail_explanation?: string;
  remediation?: string;
  details?: string;
}

export interface ScoreReport {
  content_url: string;
  content_title?: string;
  scored_at: string;
  total_score: number;
  max_score: number;
  grade: Grade;
  grade_label: string;
  criteria_passed: number;
  criteria_failed: number;
  critical_failures: string[];
  is_publishable: boolean;
  results: CriterionResult[];
  priority_actions: PriorityAction[];
  section_scores: SectionScore[];
  metadata: ContentMetadata;
}

export interface PriorityAction {
  id: string;
  label: string;
  impact: ImpactLevel;
  remediation: string;
  fail_explanation: string;
}

export interface SectionScore {
  section: string;
  label: string;
  score: number;
  max_score: number;
  passed: number;
  total: number;
}

export interface ContentMetadata {
  word_count: number;
  sentence_count: number;
  h1: string;
  h2_count: number;
  paragraph_count: number;
  has_faq: boolean;
  has_schema: boolean;
  keyword_density?: number;
  avg_sentence_length?: number;
  long_sentences?: { text: string; words: number }[];
}

export interface ParsedContent {
  h1: string;
  h2s: string[];
  full_text: string;
  opening_text: string;
  html: string;
  paragraphs: string[];
  sections: ContentSection[];
  faq_items: { question: string; answer: string }[];
  schema_types: string[];
  word_count: number;
  sentences: string[];
  raw_html: string;
}

export interface ContentSection {
  heading: string;
  body: string;
  word_count: number;
  paragraphs: string[];
  sentences: string[];
}
