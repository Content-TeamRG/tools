export type AnalyzeRequest =
  | { mode: "url"; url: string }
  | { mode: "text"; text: string; title?: string };

export interface PageContext {
  industry: string;
  sub_vertical: string;
  icp: string;
  icp_seniority: string;
  product_name: string;
  product_category: string;
  core_value_prop: string;
  key_pain_points: string[];
  voice_markers: {
    tone: string;
    formality: "formal" | "casual" | "mixed";
    uses_jargon: boolean;
    perspective: "we" | "you" | "third-person";
  };
  terminology: string[];
  competitor_mentions: string[];
  social_proof_style: string;
  pricing_model_signal: string;
}

export type ScoreBucket = "weak" | "mid" | "ok";

export interface SentenceScore {
  id: number;
  text: string;
  score: ScoreBucket;
  rule_id: string;
  one_line_reason: string;
}

export interface Finding {
  rule_id: string;
  severity: "high" | "medium" | "low";
  original_sentence: string;
  why_it_fails_for_this_audience: string;
  rewrite_suggestion: string;
  rewrite_explanation: string;
}

export type ModuleId =
  | "vp_messaging"
  | "cta"
  | "trust_social_proof"
  | "copy_readability"
  | "above_the_fold"
  | "form_friction";

export interface ModuleScore {
  id: ModuleId;
  name: string;
  score: number;
  max: number;
  one_line_diagnosis: string;
}

export interface AnalyzeResult {
  overall_score: number;
  score_label: "weak" | "moderate" | "strong";
  summary: string;
  module_scores: ModuleScore[];
  page_context: PageContext;
  sentence_scores: SentenceScore[];
  findings: Finding[];
  meta: {
    page_title: string;
    page_url?: string;
    word_count: number;
    sentence_count: number;
    duration_ms: number;
    truncated: boolean;
    original_text: string;
  };
}

export interface RewriteChange {
  before: string;
  after: string;
  reason: string;
}

export type RewriteMode = "mistakes" | "serp" | "both" | "competitor";

export interface RewriteResult {
  rewritten_text: string;
  change_log: RewriteChange[];
  applied_findings_count: number;
  mode_used: RewriteMode;
  meta: {
    duration_ms: number;
    original_word_count: number;
    rewritten_word_count: number;
  };
}

export interface RewriteSerpInput {
  keyword: string;
  swot_opportunities: string[];
  swot_weaknesses: string[];
  differentiation_themes: string[];
  vs_cluster_strengths: string;
  vs_cluster_gaps: string;
}

export interface RewriteCompetitorInput {
  competitor_label: string;
  competitor_value_prop: string;
  competitor_summary: string;
  modules_competitor_wins: {
    name: string;
    your_pct: number;
    competitor_pct: number;
    competitor_diagnosis: string;
  }[];
}

export interface RewriteRequest {
  mode: RewriteMode;
  original_text: string;
  page_context: PageContext;
  findings?: Finding[];
  weak_sentences?: SentenceScore[];
  serp?: RewriteSerpInput;
  competitor?: RewriteCompetitorInput;
  page_title?: string;
}

export interface SerpAd {
  advertiser: string;
  headline: string;
  url: string;
  snippet: string;
}

export interface SerpCompetitor {
  url: string;
  title: string;
  snippet: string;
  company: string;
  page_type:
    | "landing_page"
    | "product_page"
    | "pricing"
    | "category"
    | "homepage"
    | "other";
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface YourPagePosition {
  vs_cluster_strengths: string;
  vs_cluster_gaps: string;
  differentiation_themes: string[];
}

export interface SerpResult {
  keyword_used: string;
  ads: SerpAd[];
  organic_competitors: SerpCompetitor[];
  swot: SwotAnalysis;
  your_page_position: YourPagePosition;
  excluded_count: number;
  search_confidence: "high" | "medium" | "low";
  meta: {
    duration_ms: number;
    competitors_fetched: number;
    competitors_failed: number;
  };
}

export interface SerpRequest {
  keyword: string;
  page_context: PageContext;
  page_url?: string;
  page_title?: string;
  original_text?: string;
}

export interface AnalyzeError {
  error: string;
  detail?: string;
}
