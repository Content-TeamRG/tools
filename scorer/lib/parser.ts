import * as cheerio from 'cheerio';
import type { ParsedContent, ContentSection } from './scorer/types';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

export function parseHtml(html: string): ParsedContent {
  const $ = cheerio.load(html);

  // Remove nav, footer, header, scripts, styles
  $('nav, footer, header, script, style, noscript, aside, .sidebar, #sidebar').remove();

  const h1 = $('h1').first().text().trim();

  const h2s: string[] = [];
  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2s.push(text);
  });

  // Extract paragraphs
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) paragraphs.push(text);
  });

  const full_text = $('body').text().replace(/\s+/g, ' ').trim();
  const word_count = countWords(full_text);
  const sentences = splitSentences(full_text);

  // Opening text: first ~300 words
  const opening_words = full_text.split(/\s+/).slice(0, 300).join(' ');

  // Extract sections (content between H2 headings)
  const sections: ContentSection[] = [];
  $('h2').each((_, h2El) => {
    const heading = $(h2El).text().trim();
    let body = '';
    const bodyParagraphs: string[] = [];
    let nextEl = $(h2El).next();

    while (nextEl.length && !nextEl.is('h2')) {
      const text = nextEl.text().trim();
      if (text) {
        body += ' ' + text;
        bodyParagraphs.push(text);
      }
      nextEl = nextEl.next();
    }

    body = body.trim();
    sections.push({
      heading,
      body,
      word_count: countWords(body),
      paragraphs: bodyParagraphs,
      sentences: splitSentences(body),
    });
  });

  // Extract FAQ items
  const faq_items: { question: string; answer: string }[] = [];
  // Look for FAQ patterns: dt/dd, question/answer divs, or numbered Q&A
  $('[class*="faq"], [id*="faq"], .faq-item, .faq-section').each((_, el) => {
    $(el).find('dt, [class*="question"], h3, h4').each((__, qEl) => {
      const question = $(qEl).text().trim();
      const answer = $(qEl).next().text().trim();
      if (question && answer) faq_items.push({ question, answer });
    });
  });

  // Fallback: look for Q: A: patterns or sequential h3+p
  if (faq_items.length === 0) {
    $('h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('?')) {
        const answer = $(el).next('p').text().trim();
        if (answer) faq_items.push({ question: text, answer });
      }
    });
  }

  // Extract schema types from JSON-LD
  const schema_types: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const types = Array.isArray(json) ? json.map((j: {['@type']?: string}) => j['@type']) : [json['@type']];
      types.filter(Boolean).forEach((t: string) => schema_types.push(t));
    } catch {
      // ignore invalid JSON
    }
  });

  return {
    h1,
    h2s,
    full_text,
    opening_text: opening_words,
    html,
    paragraphs,
    sections,
    faq_items,
    schema_types,
    word_count,
    sentences,
    raw_html: html,
  };
}

export function parseText(text: string): ParsedContent {
  // Parse markdown-like plain text
  const lines = text.split('\n');
  let h1 = '';
  const h2s: string[] = [];
  const paragraphs: string[] = [];
  const sections: ContentSection[] = [];
  let currentSection: ContentSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      h1 = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim();
      h2s.push(heading);
      if (currentSection) sections.push(currentSection);
      currentSection = { heading, body: '', word_count: 0, paragraphs: [], sentences: [] };
    } else if (!trimmed.startsWith('#')) {
      if (currentSection) {
        currentSection.body += ' ' + trimmed;
        currentSection.paragraphs.push(trimmed);
      } else {
        paragraphs.push(trimmed);
      }
    }
  }

  if (currentSection) sections.push(currentSection);

  // Recalculate word counts for sections
  sections.forEach((s) => {
    s.body = s.body.trim();
    s.word_count = countWords(s.body);
    s.sentences = splitSentences(s.body);
  });

  const full_text = text.replace(/#+\s/g, '').replace(/\s+/g, ' ').trim();

  return {
    h1,
    h2s,
    full_text,
    opening_text: full_text.split(/\s+/).slice(0, 300).join(' '),
    html: '',
    paragraphs,
    sections,
    faq_items: [],
    schema_types: [],
    word_count: countWords(full_text),
    sentences: splitSentences(full_text),
    raw_html: '',
  };
}
