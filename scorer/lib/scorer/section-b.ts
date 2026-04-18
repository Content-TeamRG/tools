import type { CriterionResult, ParsedContent } from './types';

const CROSS_REF_PATTERNS = /\b(as mentioned above|as covered earlier|building on the previous|see section|as we discussed|in the next section|as noted (above|earlier|previously)|as (we|I) mentioned|as described (above|earlier)|refer to (the )?(previous|next|above)|discussed (above|earlier))\b/i;


export function scoreB1(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  if (sections.length === 0) {
    return {
      id: 'B1',
      label: 'Answer capsule after every H2',
      impact: 'critical',
      section: 'B',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No H2 sections found. Answer capsules cannot be evaluated.',
      remediation: 'Add H2 sections. Each must open with a 120–150 character standalone answer capsule immediately after the heading.',
    };
  }

  // Answer capsule: a short (120-150 char) sentence immediately after H2
  // We check if any section starts with a standalone short sentence (120-150 chars)
  const failingSections = sections.filter((s) => {
    const firstSentence = s.sentences[0] || '';
    const charCount = firstSentence.length;
    return !(charCount >= 80 && charCount <= 200); // relaxed bounds for plain text
  });

  const pass = failingSections.length === 0;
  return {
    id: 'B1',
    label: 'Answer capsule after every H2',
    impact: 'critical',
    section: 'B',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: failingSections.length > 0 ? `${failingSections.length}/${sections.length} sections missing proper answer capsule` : undefined,
    fail_explanation: 'Answer capsules are missing or incorrectly formatted. Content with answer capsules is cited 67% more frequently than content without them. The capsule is the primary extractable statement.',
    remediation: 'Write a 120–150 character standalone statement after each H2 before the body paragraph. It must answer the H2 question completely on its own. Remove all internal links from inside it.',
  };
}

export function scoreB2(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  const fullText = content.full_text;
  const inShortCount = (fullText.match(/\bin short[:\s]/gi) || []).length;
  const pass = sections.length > 0 && inShortCount >= sections.length;
  return {
    id: 'B2',
    label: "'In short:' summary ends every section",
    impact: 'high',
    section: 'B',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Found ${inShortCount} "In short:" blocks for ${sections.length} sections`,
    fail_explanation: '"In short:" summaries are missing from one or more sections. Each "In short:" block is a second extraction target per section — it doubles the section\'s citation surface.',
    remediation: 'Add "In short:" + 40–60 word summary at the end of every H2 section. Restate the key fact and stat from the section. It must make complete sense if read alone.',
  };
}

export function scoreB3(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  if (sections.length === 0) {
    return {
      id: 'B3',
      label: 'Section word count 200–400 words',
      impact: 'medium',
      section: 'B',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No sections to evaluate.',
      remediation: 'Structure content into H2 sections, each 200–400 words.',
    };
  }
  const thinSections = sections.filter((s) => s.word_count < 200);
  const longSections = sections.filter((s) => s.word_count > 400);
  const pass = thinSections.length === 0 && longSections.length === 0;
  const details = [];
  if (thinSections.length) details.push(`${thinSections.length} thin sections (<200 words)`);
  if (longSections.length) details.push(`${longSections.length} long sections (>400 words)`);
  return {
    id: 'B3',
    label: 'Section word count 200–400 words',
    impact: 'medium',
    section: 'B',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: details.join('; ') || undefined,
    fail_explanation: 'One or more sections fall outside the 200–400 word range. Under 200 is insufficient for a clean chunk. Over 400 means two distinct topics are being combined, reducing retrieval precision.',
    remediation: 'For thin sections (<200): add one supporting paragraph with a named stat and a table or list. For long sections (>400): find the natural sub-topic break and split into two question H2s.',
  };
}

export function scoreB4(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  const hasCrossRef = CROSS_REF_PATTERNS.test(text);
  const matches = text.match(CROSS_REF_PATTERNS);
  return {
    id: 'B4',
    label: 'No cross-section references anywhere',
    impact: 'critical',
    section: 'B',
    points_awarded: hasCrossRef ? 0 : 2,
    status: hasCrossRef ? 'fail' : 'pass',
    details: matches ? `Found: "${matches[0]}"` : undefined,
    fail_explanation: 'Cross-section references detected. RAG retrieves chunks in isolation. When a section says "as mentioned above", that reference is broken when only that chunk is retrieved.',
    remediation: "Search for: 'above', 'below', 'previous', 'next section', 'earlier', 'as we'. Remove every instance. Replace by restating the relevant context inline within the same section.",
  };
}

export function scoreB5(content: ParsedContent): CriterionResult {
  const text = content.full_text;
  // Look for conclusion section with bullets
  const conclusionMatch = text.match(/conclusion[^]*$/i);
  if (!conclusionMatch) {
    return {
      id: 'B5',
      label: 'Conclusion: 5–7 standalone bullet points',
      impact: 'high',
      section: 'B',
      points_awarded: 0,
      status: 'fail',
      fail_explanation: 'No conclusion section detected. 24.7% of all citations come from the final 30% of a page.',
      remediation: 'Add a conclusion section with 5–7 standalone bullet points. Each must contain one complete, verifiable, standalone fact.',
    };
  }
  const conclusionText = conclusionMatch[0];
  // Count bullet-like patterns: lines starting with -, *, •, or numbered 1. 2.
  const bulletCount = (conclusionText.match(/^[\s]*[-•*]|\d+\.\s/gm) || []).length;
  const pass = bulletCount >= 5 && bulletCount <= 10;
  return {
    id: 'B5',
    label: 'Conclusion: 5–7 standalone bullet points',
    impact: 'high',
    section: 'B',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: `Bullet points in conclusion: ${bulletCount}`,
    fail_explanation: 'The conclusion is a paragraph summary rather than standalone bullet points. 24.7% of all citations come from the final 30% of a page. Five standalone bullets are five independent extraction targets.',
    remediation: 'Delete the paragraph conclusion. Write 5–7 bullets. Each must contain one complete, verifiable, standalone fact. Test each bullet: cover all others — does it still make complete sense alone?',
  };
}

export function scoreB6(content: ParsedContent): CriterionResult {
  const sections = content.sections;
  // Detect acronyms: 2-5 uppercase letters
  const acronymRegex = /\b([A-Z]{2,5})\b/g;
  let hasUndefinedAcronym = false;

  for (const section of sections) {
    const acronyms = new Set<string>();
    let match: RegExpExecArray | null;
    const re = new RegExp(acronymRegex.source, 'g');
    while ((match = re.exec(section.body)) !== null) {
      const acronym = match[1];
      // Check if it's defined: look for "Full Name (ACRONYM)" pattern
      const definitionPattern = new RegExp(`\\w+[\\w\\s]+\\s*\\(${acronym}\\)`, 'i');
      if (!definitionPattern.test(section.body)) {
        acronyms.add(acronym);
      }
    }
    // Filter common non-acronym caps (I, AI, SEO, etc. are usually known — only flag truly undefined ones)
    const flagged = Array.from(acronyms).filter((a) => !['I', 'OK', 'US', 'UK', 'EU', 'AI'].includes(a));
    if (flagged.length > 0) {
      hasUndefinedAcronym = true;
      break;
    }
  }

  return {
    id: 'B6',
    label: 'Acronyms defined in every section independently',
    impact: 'medium',
    section: 'B',
    points_awarded: hasUndefinedAcronym ? 0 : 2,
    status: hasUndefinedAcronym ? 'fail' : 'pass',
    fail_explanation: 'One or more acronyms appear undefined in a section. Chunks are evaluated in isolation by RAG systems. Undefined acronyms cause entity mapping failures.',
    remediation: "Scan every H2 section independently. Any acronym that appears — even if defined 500 words earlier — must be expanded on its first use within that section. Format: 'Full Name (ACRONYM)' on first use.",
  };
}
