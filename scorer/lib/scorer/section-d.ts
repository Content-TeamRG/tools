import type { CriterionResult, ParsedContent } from './types';

export function scoreD1(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasFaq = /\bFAQ\b|frequently asked questions?/i.test(text);
  const hasFaqSchema = content.schema_types.some((t) => t === 'FAQPage');
  // Count Q&A items
  const faqItems = content.faq_items;
  const questionCount = (text.match(/\?/g) || []).length;
  const enoughQuestions = faqItems.length >= 5 || questionCount >= 5;
  const pass = hasFaq && enoughQuestions && hasFaqSchema;

  const details: string[] = [];
  if (!hasFaq) details.push('No FAQ section detected');
  if (!hasFaqSchema) details.push('FAQPage schema missing');
  if (faqItems.length > 0) details.push(`${faqItems.length} FAQ items found`);

  return {
    id: 'D1',
    label: 'FAQ section with 5–8 questions and FAQPage schema',
    impact: 'critical',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: details.join('; ') || undefined,
    fail_explanation: 'FAQ section or FAQPage schema missing. Pages with FAQPage schema achieve a 41% citation rate versus 15% without it (Relixir, 2025) — a 2.7x lift. Each Q&A pair is an independent citation target.',
    remediation: 'Source 5–8 questions from Google "People Also Ask", AlsoAsked.com, and Perplexity "Related Questions". Write each answer as a 40–60 word standalone response. Apply FAQPage schema. Validate at search.google.com/test/rich-results.',
  };
}

export function scoreD2(content: ParsedContent): CriterionResult {
  const h2s = content.h2s;
  const faqItems = content.faq_items;
  // Fan-out questions: H2s that are sub-questions of the main topic, plus FAQ entries
  const questionH2s = h2s.filter((h) => h.includes('?'));
  const totalFanOut = questionH2s.length + faqItems.length;
  const pass = totalFanOut >= 4;
  return {
    id: 'D2',
    label: '4–5 fan-out questions covered',
    impact: 'high',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `${totalFanOut} fan-out questions found (${questionH2s.length} H2s + ${faqItems.length} FAQ items)`,
    fail_explanation: 'Fewer than 4 fan-out questions are covered. 89.6% of ChatGPT searches generate 2+ fan-out queries. 32.9% of cited pages appeared only in fan-out SERP results (AirOps, 43,233 queries).',
    remediation: 'Open ChatGPT and ask your H1 question. Then ask: "What sub-queries did you search to answer that?" Add the top 4–5 sub-queries as H2 sections or FAQ entries — each needs its own answer capsule.',
  };
}

export function scoreD3(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const html = content.html;
  // Check for comparison-type H2s
  const hasComparisonH2 = content.h2s.some((h) =>
    /\bvs\.?\b|\bversus\b|\bcompare[sd]?\b|\bdifference\b|\bbetter\b|\bor\b.*\?/i.test(h)
  );
  // Check for tables in HTML
  const hasTables = html ? /<table/i.test(html) : /\|.*\|.*\|/m.test(text);
  // Check for "best for" selector
  const hasBestFor = /\bbest for\b/i.test(text);

  const pass = !hasComparisonH2 || (hasTables && hasBestFor);
  return {
    id: 'D3',
    label: 'Comparison table for every X vs Y topic',
    impact: 'high',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: hasComparisonH2 ? `Comparison section found. Table: ${hasTables ? 'yes' : 'no'}. "Best for" row: ${hasBestFor ? 'yes' : 'no'}` : 'No comparison sections detected',
    fail_explanation: 'Comparison tables missing from multi-option sections. Tables are the most-extracted format in Google AI Overviews and reduce ambiguity in RAG retrieval. Prose comparisons require AI to parse and structure itself.',
    remediation: 'Identify every section comparing 2+ options. Replace or supplement prose comparisons with a table: 3–5 rows, descriptive column headers, and a "Best for: [specific audience]" row at the bottom.',
  };
}

export function scoreD4(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  // Find "What is X?" H2 sections
  const definitionSections = sections.filter((s) => /^what is /i.test(s.heading));
  if (definitionSections.length === 0) {
    // No "what is" sections — pass by default (not applicable)
    return {
      id: 'D4',
      label: "Definition blocks for 'What is X?' sections",
      impact: 'high',
      section: 'D',
      points_awarded: 2,
      status: 'pass',
      details: 'No "What is X?" sections found — not applicable',
      fail_explanation: '',
      remediation: '',
    };
  }

  // Check each "What is" section for a definition block (3-sentence opening with the term)
  const failingSections = definitionSections.filter((s) => {
    const sentences = s.sentences.slice(0, 3);
    // First sentence should contain the entity from the heading + "is"
    const entityMatch = s.heading.match(/what is (.+)\??/i);
    if (!entityMatch) return true;
    const entity = entityMatch[1].toLowerCase().replace(/[?]/g, '');
    return !sentences[0]?.toLowerCase().includes(entity) || !/ is | are /i.test(sentences[0] || '');
  });

  const pass = failingSections.length === 0;
  return {
    id: 'D4',
    label: "Definition blocks for 'What is X?' sections",
    impact: 'high',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: failingSections.length > 0 ? `${failingSections.length}/${definitionSections.length} definition sections missing proper structure` : undefined,
    fail_explanation: "Definition blocks missing from 'What is X?' sections. AI systems look for clean definitional paragraphs when users ask 'what is [X]?' — these are the most consistent citation targets across all platforms.",
    remediation: "For every 'What is X?' H2, structure the opening paragraph as: (1) '[Exact term] is [definition].' (2) '[Context: who uses it, when].' (3) '[Significance or impact].'",
  };
}

export function scoreD5(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const html = content.html;
  // Check for how-to / step-by-step content
  const hasProcess = /\bhow to\b|\bstep[s]? (to|for|by step)\b|\bprocess\b/i.test(content.h2s.join(' '));
  if (!hasProcess) {
    return {
      id: 'D5',
      label: 'Numbered step-by-step processes with HowTo schema',
      impact: 'high',
      section: 'D',
      points_awarded: 2,
      status: 'pass',
      details: 'No process/how-to sections found — not applicable',
      fail_explanation: '',
      remediation: '',
    };
  }

  const hasNumberedSteps = /^\s*\d+\.\s/m.test(text);
  const hasHowToSchema = content.schema_types.some((t) => t === 'HowTo') ||
    (html ? /"@type"\s*:\s*"HowTo"/i.test(html) : false);

  const pass = hasNumberedSteps && hasHowToSchema;
  return {
    id: 'D5',
    label: 'Numbered step-by-step processes with HowTo schema',
    impact: 'high',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Numbered steps: ${hasNumberedSteps ? 'yes' : 'no'}. HowTo schema: ${hasHowToSchema ? 'yes' : 'no'}`,
    fail_explanation: 'Process content uses bullet points instead of numbered steps, or HowTo schema is missing. HowTo schema is extracted and displayed directly in AI answer formats — bulleted processes are not.',
    remediation: "Convert all bulleted process lists to numbered steps. Format: '1. [Action verb] [specific instruction]. [Expected outcome].' End with 'In short:' summary. Apply HowTo schema. Validate at search.google.com/test/rich-results.",
  };
}

export function scoreD6(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const sections = content.sections;
  const keyTakeawayCount = (text.match(/\bkey takeaways?\b/gi) || []).length;
  const pass = sections.length > 0 && keyTakeawayCount >= Math.ceil(sections.length * 0.7);
  return {
    id: 'D6',
    label: 'Key Takeaways block after each major section',
    impact: 'medium',
    section: 'D',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Found ${keyTakeawayCount} "Key Takeaways" blocks for ${sections.length} sections`,
    fail_explanation: 'Key Takeaways blocks missing from one or more sections. Key Takeaways blocks serve as summaries for the LLM — they are clean extraction targets that the model can pull independently from the surrounding section.',
    remediation: "After each major H2 section body, add: 'Key Takeaways:' followed by 3–4 bullet points. Each bullet = one standalone sentence containing a complete, verifiable fact. Total 40–60 words.",
  };
}

export function scoreD7(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  // Check if there are comparison sections
  const hasComparison = content.h2s.some((h) =>
    /\bvs\.?\b|\bversus\b|\bcompare[sd]?\b|\bdifference\b/i.test(h)
  );
  if (!hasComparison) {
    return {
      id: 'D7',
      label: "'Best for' selector after every comparison",
      impact: 'medium',
      section: 'D',
      points_awarded: 2,
      status: 'pass',
      details: 'No comparison sections found — not applicable',
      fail_explanation: '',
      remediation: '',
    };
  }
  const hasBestFor = /\bbest for\b.*:/i.test(text) || /\bbest for\b.{0,50}\[/i.test(text);
  return {
    id: 'D7',
    label: "'Best for' selector after every comparison",
    impact: 'medium',
    section: 'D',
    points_awarded: hasBestFor ? 2 : 0,
    status: hasBestFor ? 'pass' : 'fail',
    fail_explanation: '"Best for" selectors missing from comparison sections. AI engines use "Best for" selectors to answer "which is right for my situation" follow-up queries — a growing, high-commercial-intent query pattern.',
    remediation: "After every comparison table, add 1–3 sentences: 'Best for [specific audience A]: [Option X]. Best for [specific audience B]: [Option Y].' The audience must be specific.",
  };
}
