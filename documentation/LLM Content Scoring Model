**LLM Content Scoring Model**

*Automated scoring specification  criteria, pass/fail logic, and remediation*

**29 criteria  ·  40 points  ·  6 sections  ·  Pass/Fail per criterion**

## **Purpose**

This document is the specification for an automated LLM content scoring tool. Each criterion defines what to detect in a piece of content, what constitutes a pass or fail, and  if it fails  a precise explanation of why it fails and exactly how to fix it.

The tool ingests a piece of content, evaluates it against each of the 29 criteria below, assigns 2 points for pass and 0 for fail, and outputs a total score out of 40, a citation readiness grade, and a prioritised list of failed criteria with remediation instructions.

*All criteria, pass/fail logic, explanations, and remediation instructions are derived exclusively from the source playbook: 'How to Write Content That Ranks on LLMs, AI Overviews, ChatGPT & Perplexity'. Nothing has been added from outside that document.*

## **Citation readiness grades**

| Score | Grade | What it means |
| :---- | :---- | :---- |
| **37–40** | **A  Citation-ready** | Publish and monitor. Content is structured to be retrieved and cited by ChatGPT, Perplexity, and Google AI Overviews. |
| **30–36** | **B  Strong** | Most signals in place. Resolve remaining failures before publishing, especially any Critical criteria. |
| **20–29** | **C  Needs work** | Significant structural or writing issues. Do not publish until all Critical criteria pass and the score reaches 30+. |
| **0–19** | **D  Not citation-ready** | Fundamental rebuild required. Start with all Critical-impact criteria. Republish only after re-scoring. |

## **Scoring logic**

Each criterion is binary. There are no partial scores. The criterion either meets the exact standard defined in the pass condition (2 pts) or it does not (0 pts). When a criterion fails, the tool outputs:

1\. The fail explanation  why this failure reduces citation probability, with the specific data point from the playbook.

2\. The remediation is the precise action to take to turn this criterion into a pass.

**Critical-impact criteria must all pass before the content is considered publishable, regardless of total score. A score of 38/40 with two Critical failures is not publication-ready.**

| Section A: Opening & Structure |
| :---- |

*Controls whether the first retrieved chunk answers the broadest queries. 44.2% of all citations come from the first 30% of a page (AirOps, 1.2M citations). Failures here mean the article misses the highest-volume query surface entirely.*

### **A1  H1 is a direct question**

| Criterion ID | A1 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | H1 must be a question the user would type into ChatGPT  not a topic label, noun phrase, or 'ultimate guide'. |
| **Pass condition** | H1 contains a question mark and begins with an interrogative word (What, How, Why, When, Which, Is, Are, Can, Should). |
| **Fail explanation** | Your H1 is a topic label, not a question. AI engines match headings to user sub-queries. 78.4% of ChatGPT citations with questions come from headings. A topic label is never a sub-query match. |
| **How to fix** | Rewrite H1 as the exact question a user types into ChatGPT. 'Variable Sales Compensation: A Complete Guide' → 'What Is Variable Sales Compensation and How Does It Work?' Must contain a question mark. |

### **A2  TL;DR block present and correctly structured**

| Criterion ID | A2 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | A TL;DR block must appear directly below the H1, before any body content. Must be 40–60 words, open with a summary sentence under 25 words, contain 2–4 bullets, and start with the focus keyword. |
| **Pass condition** | TL;DR block present immediately after H1, 40–60 words, summary sentence \+ bullets, starts with focus keyword. |
| **Fail explanation** | No TL;DR block detected under the H1. The TL;DR is the first chunk retrieved for the broadest queries. Without it, the article fails retrieval on the widest query surface before any section content is read. |
| **How to fix** | Add a TL;DR block directly below the H1: one sentence under 25 words (starting with the focus keyword) \+ 2–4 bullet points. Total: 40–60 words. This is not your meta description. |

### **A3  Opening ≤200 words with BLUF structure**

| Criterion ID | A3 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | First 200 words must follow BLUF: sentence 1–2 \= direct answer to H1 with primary keyword in sentence 1; sentence 3–4 \= named, dated, linked stat; sentence 5–6 \= context. No preamble. Word count must not exceed 200\. |
| **Pass condition** | Opening ≤200 words, sentence 1 directly answers H1 with primary keyword, named+dated stat present, context sentence present, no preamble language detected. |
| **Fail explanation** | The opening does not follow BLUF structure. 44.2% of citations come from the first 30% of a page. Scene-setting prose means the article fails retrieval for the highest-volume queries  the ones generating the most traffic. |
| **How to fix** | Restructure opening: (1) Sentence 1–2: Direct answer to H1 with primary keyword. (2) Sentence 3–4: Named, dated stat with source and link. (3) Sentence 5–6: Context  who, when, stakes. Delete all else. Hard limit: 200 words. |

### **A4  Every H2 is a question**

| Criterion ID | A4 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every H2 must be phrased as a question. Topic labels, noun phrases, 'Overview', 'Benefits', 'Best Practices', or any non-question H2 must be flagged. |
| **Pass condition** | All H2 headings contain a question mark and are phrased as natural user queries. |
| **Fail explanation** | One or more H2s are topic labels. In the RAG process, H2s function as AI's user prompts  the paragraph below becomes the generated response. A topic label is not a sub-query and will not be matched. 78.4% of citations with questions come from headings. |
| **How to fix** | Rewrite every non-question H2: 'Benefits and Drawbacks' → 'What Are the Pros and Cons of \[Topic\]?'; 'Overview' → 'What Is \[Topic\] and How Does It Work?'; 'Best Practices' → 'What Does Best-in-Class \[Topic\] Look Like?' Every H2 needs a question mark. |

### **A5  Entity echoing on every H2 section**

| Criterion ID | A5 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | The first word of the body paragraph immediately after each H2 must be the main entity named in the H2. Paragraphs beginning with 'It', 'This', 'There', 'The', 'They', or any pronoun must be flagged. |
| **Pass condition** | First word of every H2 section paragraph is the main entity from that H2 (specific noun: product, concept, company, or technique name). |
| **Fail explanation** | Entity echoing is missing. LLMs build a knowledge graph of entities and select chunks matching natural query phrasing. When a paragraph opens with 'It is...' or 'This means...', the entity mapping fails and the chunk is not reliably retrieved for that query. |
| **How to fix** | Replace: 'It is a method that...' → '\[Entity name\] is a method that...'; 'This approach helps...' → '\[Specific approach name\] helps...' Rule: H2 asks about X, first word of next paragraph is X. |

| Section B: Section Quality |
| :---- |

*Controls whether individual chunks are retrievable in isolation. RAG systems evaluate each H2 section independently. A section that depends on previous sections for context will be skipped.*

### **B1  Answer capsule after every H2**

| Criterion ID | B1 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | A 120–150 character standalone answer capsule must appear immediately after every H2 heading. Must be completely self-contained, make sense with zero surrounding context, and contain zero internal hyperlinks. |
| **Pass condition** | Every H2 section has a 120–150 character answer capsule that is standalone and link-free. |
| **Fail explanation** | Answer capsules are missing or incorrectly formatted. Content with answer capsules is cited 67% more frequently than content without them. The capsule is the primary extractable statement  it is what AI retrieves when matching a sub-query to this section. |
| **How to fix** | Write a 120–150 character standalone statement after each H2 before the body paragraph. It must answer the H2 question completely on its own. Remove all internal links from inside it. If you cannot write it in 150 characters, the section topic is not yet clear enough to write. |

### **B2  'In short:' summary ends every section**

| Criterion ID | B2 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every H2 section must end with a 40–60 word 'In short:' micro-summary. It must function as a standalone extraction target with zero surrounding context required. |
| **Pass condition** | Every H2 section ends with an 'In short:' block of 40–60 words that is fully standalone. |
| **Fail explanation** | 'In short:' summaries are missing from one or more sections. Each 'In short:' block is a second extraction target per section  it doubles the section's citation surface and gives AI a clean, pre-summarised chunk to pull for different query phrasings of the same topic. |
| **How to fix** | Add 'In short:' \+ 40–60 word summary at the end of every H2 section. Restate the key fact and stat from the section. Do not reference earlier text. It must make complete sense if read alone. |

### **B3  Section word count 200–400 words**

| Criterion ID | B3 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every H2 section body must be between 200 and 400 words. Under 200 is too thin for a clean retrievable chunk. Over 400 should be split into two H2 sections. |
| **Pass condition** | All H2 sections are 200–400 words. |
| **Fail explanation** | One or more sections fall outside the 200–400 word range. Under 200 words is insufficient for a clean chunk  the section lacks enough substance for AI to verify the answer. Over 400 words means two distinct topics are being combined, reducing retrieval precision for both. |
| **How to fix** | Count words per section. For thin sections (under 200): add one supporting paragraph with a named stat and a table or list. For long sections (over 400): find the natural sub-topic break and split into two question H2s, each with their own capsule and 'In short:' summary. |

### **B4  No cross-section references anywhere**

| Criterion ID | B4 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | The article must contain zero instances of: 'as mentioned above', 'as covered earlier', 'building on the previous point', 'see section X', 'as we discussed', 'in the next section', or any equivalent cross-reference. |
| **Pass condition** | Zero cross-section references detected in the full article. |
| **Fail explanation** | Cross-section references detected. RAG retrieves chunks in isolation. When a section says 'as mentioned above', that reference is broken when only that chunk is retrieved  the AI gets an incomplete, context-dependent answer that fails verification. |
| **How to fix** | Search the document for: 'above', 'below', 'previous', 'next section', 'earlier', 'as we'. Remove every instance. Replace by restating the relevant context inline within the same section. Every section must be fully intelligible on its own. |

### **B5  Conclusion: 5–7 standalone bullet points**

| Criterion ID | B5 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | The conclusion must be 5–7 bullet points, each independently citable with zero surrounding context. A paragraph summary is a fail. |
| **Pass condition** | Conclusion is 5–7 bullet points, each a complete standalone fact. |
| **Fail explanation** | The conclusion is a paragraph summary rather than standalone bullet points. 24.7% of all citations come from the final 30% of a page. A paragraph conclusion is one extraction target. Five standalone bullets are five independent extraction targets  each citable separately for different queries. |
| **How to fix** | Delete the paragraph conclusion. Write 5–7 bullets. Each must contain one complete, verifiable, standalone fact  e.g. 'Variable sales compensation links rep pay to performance. The 70/30 split is the SaaS benchmark.' Test each bullet: cover all others. Does it still make complete sense alone? |

### **B6  Acronyms defined in every section independently**

| Criterion ID | B6 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every acronym must be defined on its first use within each H2 section, even if it was defined in a previous section. |
| **Pass condition** | All acronyms are expanded on first use within every section they appear in. |
| **Fail explanation** | One or more acronyms appear undefined in a section. Chunks are evaluated in isolation by RAG systems. If a chunk contains an undefined acronym, AI cannot reliably map the entity  the chunk fails the entity clarity check and is deprioritised for that query. |
| **How to fix** | Scan every H2 section independently as if it were the only section being read. Any acronym that appears  even if defined 500 words earlier  must be expanded on its first use within that section. Format: 'Full Name (ACRONYM)' on first use. |

| Section C: Writing Quality |
| :---- |

*Controls sentence-level clarity and information density. LLM systems understand clear, direct sentences best. Vague attribution, long sentences, and undated claims all reduce chunk quality signals.*

### **C1  All sentences ≤20 words**

| Criterion ID | C1 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every sentence in the article must be 20 words or fewer. Multi-clause sentences that embed two ideas must be flagged. |
| **Pass condition** | No sentence exceeds 20 words. Multi-clause sentences are split. |
| **Fail explanation** | Sentences exceed 20 words in one or more sections. Cited content averages Flesch-Kincaid grade 16; uncited content averages grade 19\. Long sentences embed meaning in context that RAG systems cannot reliably extract in isolation. Each sentence must carry one complete, extractable idea. |
| **How to fix** | Run content through Hemingway App or a readability checker. Flag every sentence over 20 words. Split at the first conjunction: 'and', 'but', 'which', 'that', 'because'. One clause \= one sentence. The split sentences must each be subject-verb-object complete. |

### **C2  Every stat has named source \+ year \+ link**

| Criterion ID | C2 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every factual claim must include: a specific number or finding, a named source, a year, and a link to the primary research. Phrases like 'studies show', 'experts agree', 'research indicates', 'it is widely known' must be flagged as fails. |
| **Pass condition** | All factual claims include a specific number, named source, year, and link. Zero vague attribution phrases detected. |
| **Fail explanation** | Vague attribution detected. Named, attributed statistics increased citation rates by 41% in a 50-article test (Atlas Marketing). AI engines distinguish between sources that generate data and sources that reference data. Vague attribution fails the verifiability check  the claim cannot be confirmed, so the chunk is deprioritised. |
| **How to fix** | Search for: 'studies show', 'research indicates', 'experts agree', 'it is known', 'many companies'. Replace each with: 'According to \[Named Source\] \[Year\], \[specific number or finding\]' and link directly to the primary study  not to a blog that cites the study. If no primary source can be found, remove the claim entirely. |

### **C3  One attributed stat every 150–200 words**

| Criterion ID | C3 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | One attributed stat (specific number \+ named source \+ year) must appear at minimum once every 150–200 words throughout the full article. Stats must not be clustered in one section while others have none. |
| **Pass condition** | Attributed stats appear at intervals of 150–200 words throughout the full article. |
| **Fail explanation** | Stat density is below the required threshold in one or more sections. Stat density is a chunk quality signal  each named stat is a verifiable anchor point. Sections without stats are treated as lower-confidence by AI retrieval systems and are cited less frequently (Frase.io GEO analysis). |
| **How to fix** | Divide the total word count by 175\. That is the minimum number of attributed stats required. Map one stat per word-count interval across the full article  not clustered at the top. If a gap exceeds 200 words, find a primary source to fill it, or remove the unsupported claim rather than leaving it vague. |

### **C4  No vague time language**

| Criterion ID | C4 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Words and phrases including 'recently', 'in recent years', 'nowadays', 'in today's world', 'modern', 'lately', 'these days', 'current trends' must be flagged. |
| **Pass condition** | Zero vague time language detected. All time references are specific dates or quarters. |
| **Fail explanation** | Vague time language detected. AI models treat undated claims as lower-confidence. Pages using vague time language are 3x more likely to lose AI citations over time compared to pages with specific dated claims. 'Recently' could mean last week or five years ago  AI cannot use it as a recency signal. |
| **How to fix** | Search for: 'recently', 'lately', 'in recent years', 'nowadays', 'these days', 'modern'. Replace every instance with a specific date: 'As of Q1 2025...', 'Since January 2024...', 'In the 12 months to March 2025...'. If you don't know the specific date, remove the claim. |

### **C5  Named entities used on every reference**

| Criterion ID | C5 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every reference to a product, company, tool, study, or methodology must use its full named entity. Generic references including 'the platform', 'this tool', 'our methodology', 'the company', 'industry leaders', 'the study', 'this approach' must be flagged. |
| **Pass condition** | All products, companies, tools, studies, and methodologies are named explicitly on every reference. |
| **Fail explanation** | Generic entity references detected. LLMs build a knowledge graph of entities. When content uses 'the platform' instead of 'Salesforce', the entity mapping fails  the chunk is not associated with the named entity in the LLM's knowledge graph and is not retrieved for queries about that entity. |
| **How to fix** | Search for: 'the platform', 'this tool', 'this approach', 'the company', 'the study', 'industry leaders', 'our method'. Replace every instance with the specific named entity: 'Salesforce', 'Everstage', 'Bridge Group's 2025 SaaS Benchmarks', 'RevvGrowth's 8-Step AEO Workflow'. Never use a pronoun where the entity name fits. |

### **C6  At least one original data point**

| Criterion ID | C6 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | The article must contain at least one of: own test result with specific numbers, client case study with before/after figures, or a named proprietary framework or methodology. |
| **Pass condition** | At least one original data point, case study with numbers, or named proprietary framework is present. |
| **Fail explanation** | No original data point detected. LLMs have read the 500th generic guide on most topics. Content that only references what already exists gives AI no reason to cite it over a more authoritative source. Original, non-duplicated information is the highest-value citation target  it cannot be found elsewhere (Ekamoira citation research, Playbook Rule 6). |
| **How to fix** | Add one of: (1) A test result  'We tested this across 50 articles and found 67% improvement in citation rate.' Include the specific number, timeframe, and what was measured. (2) A client case study  'Client X went from 550 to 2,300 AI-referred trials in 4 weeks.' Real numbers, real outcome. (3) A named framework  'The RevvGrowth BLUF-First Method'  a branded name for your process that AI can attribute as a unique entity. |

### **C7  All paragraphs 2–3 sentences, one idea each**

| Criterion ID | C7 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every paragraph must be 2–3 sentences maximum and contain only one idea. Paragraphs exceeding 3 sentences must be flagged. |
| **Pass condition** | All paragraphs are 2–3 sentences maximum, each containing one distinct idea. |
| **Fail explanation** | Paragraphs exceeding 3 sentences detected. Long paragraphs create fewer clean extraction points for RAG systems. Each paragraph should represent one complete, extractable idea. Dense paragraph blocks reduce the number of distinct chunks the AI can cleanly retrieve from a section. |
| **How to fix** | Scan every paragraph. Any paragraph over 3 sentences: identify the second idea and split at that point. Each paragraph \= one idea, expressed in 2–3 clear sentences. The split must not create a paragraph that starts with 'It', 'This', or 'They'  restate the subject if needed. |

| Section D: Content Formats |
| :---- |

*Controls whether the article uses the structural formats AI engines most reliably extract from. Structured formats  Q\&A, tables, definition blocks, numbered steps  are cited significantly more frequently than equivalent prose.*

### **D1  FAQ section with 5–8 questions and FAQPage schema**

| Criterion ID | D1 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | An FAQ section must be present near the article end containing 5–8 questions sourced from PAA/AlsoAsked/Perplexity. Each answer must be 40–60 words, standalone, declarative sentences only. FAQPage schema must be implemented. |
| **Pass condition** | FAQ section present near end of article, 5–8 questions with 40–60 word standalone answers, FAQPage schema applied. |
| **Fail explanation** | FAQ section or FAQPage schema missing. Pages with FAQPage schema achieve a 41% citation rate versus 15% without it (Relixir, 2025\)  a 2.7x lift. Each Q\&A pair is an independent citation target for a different sub-query. An 8-question FAQ creates 8 additional citation paths. |
| **How to fix** | Source 5–8 questions from Google 'People Also Ask', AlsoAsked.com, and Perplexity 'Related Questions'. Write each answer as a 40–60 word standalone response  it must make sense with no surrounding article context. Place the FAQ near the article end. Apply FAQPage schema wrapping the entire section. Validate at search.google.com/test/rich-results. |

### **D2  4–5 fan-out questions covered**

| Criterion ID | D2 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | 4–5 fan-out or adjacent questions must be covered as H2 sections, H3 sub-sections, or FAQ entries. These should be the sub-queries ChatGPT generates internally when researching the H1 topic. |
| **Pass condition** | 4 or more fan-out/adjacent questions are covered as H2s, H3s, or FAQ entries. |
| **Fail explanation** | Fewer than 4 fan-out questions are covered. 89.6% of ChatGPT searches generate 2+ fan-out queries  internal sub-searches invisible to users. 32.9% of cited pages appeared only in fan-out SERP results (AirOps, 43,233 queries). An article covering only the primary query earns one citation path. An article covering 5 fan-out queries earns up to 6\. |
| **How to fix** | Open ChatGPT in a fresh incognito session. Type your H1 question. After it answers, ask: 'What sub-queries did you search to answer that?' and 'What follow-up questions would someone researching this topic ask next?' Also check AlsoAsked.com and Perplexity 'Related Questions'. Add the top 4–5 sub-queries as H2 sections or FAQ entries  each needs its own answer capsule. |

### **D3  Comparison table for every X vs Y topic**

| Criterion ID | D3 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every section that compares 2 or more options, choices, tools, or approaches must include a structured comparison table with 3–5 rows, descriptive column headers (not 'Option A / Option B'), and a 'Best for:' selector row at the bottom. |
| **Pass condition** | All multi-option sections contain a comparison table with 3–5 rows, descriptive headers, and a 'Best for:' row. |
| **Fail explanation** | Comparison tables missing from one or more multi-option sections. Tables are the most-extracted format in Google AI Overviews and reduce ambiguity in RAG retrieval. Prose comparisons require the AI to parse and structure the comparison itself  tables deliver it pre-structured, reducing retrieval error. |
| **How to fix** | Identify every section comparing 2+ options. Replace or supplement prose comparisons with a table: 3–5 rows maximum, column headers that name the comparison dimension (not 'Option A'), and a 'Best for: \[specific audience\]' row at the bottom. Add a descriptive heading above the table stating the subject and data type being compared. |

### **D4  Definition blocks for 'What is X?' sections**

| Criterion ID | D4 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every H2 section phrased as 'What is X?' must open with a structured definition block: sentence 1 \= one-sentence definition using the exact term, sentence 2 \= context (who uses it, when, typical structure), sentence 3 \= significance or impact. |
| **Pass condition** | All 'What is X?' H2 sections open with a 3-sentence definition block in the correct structure. |
| **Fail explanation** | Definition blocks missing from 'What is X?' sections. AI systems look for clean definitional paragraphs when users ask 'what is \[X\]?'  these are the most consistent citation targets across all platforms. A definition block that opens with the exact term is immediately recognised as the primary definitional chunk for that entity. |
| **How to fix** | For every 'What is X?' H2, structure the opening paragraph as: (1) '\[Exact term\] is \[definition\].'  one sentence, uses the exact term. (2) '\[Context: who uses it, when, typical structure\].'  one sentence. (3) '\[Significance or impact\].'  one sentence. This 3-sentence block is the definition chunk AI retrieves. |

### **D5  Numbered step-by-step processes with HowTo schema**

| Criterion ID | D5 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | All process or how-to content must use numbered steps (not bullet points), formatted as action verb \+ specific instruction \+ outcome per step, ending with an 'In short:' line. HowTo schema must be applied. |
| **Pass condition** | All process content uses numbered steps with action verb \+ instruction \+ outcome format, ends with 'In short:', and HowTo schema is applied. |
| **Fail explanation** | Process content uses bullet points instead of numbered steps, or HowTo schema is missing. Numbered step content directly feeds voice assistants and AI answer engines that present step-format responses natively. HowTo schema is extracted and displayed directly in AI answer formats  bulleted processes are not. |
| **How to fix** | Convert all bulleted process lists to numbered steps. Format each step as: '1. \[Action verb\] \[specific instruction\]. \[Expected outcome\].' End the sequence with an 'In short:' summary line. Apply HowTo schema wrapping the numbered sequence. Validate HowTo schema at search.google.com/test/rich-results. |

### **D6  Key Takeaways block after each major section**

| Criterion ID | D6 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | A 'Key Takeaways:' block of 40–60 words containing 3–4 standalone bullet points must appear after each major H2 section body. Each bullet must be a standalone sentence with no reference to surrounding text. |
| **Pass condition** | Every major H2 section ends with a 'Key Takeaways:' block of 3–4 standalone bullets totalling 40–60 words. |
| **Fail explanation** | Key Takeaways blocks missing from one or more sections. Key Takeaways blocks serve as summaries for the LLM  they are clean extraction targets that the model can pull independently from the surrounding section (SMX Advanced 2025). They are a distinct chunk from the 'In short:' summary and target different query phrasings. |
| **How to fix** | After each major H2 section body (before the next H2), add: 'Key Takeaways:' followed by 3–4 bullet points. Each bullet \= one standalone sentence containing a complete, verifiable fact. Do not reference other bullets or the surrounding article. Total 40–60 words. |

### **D7  'Best for' selector after every comparison**

| Criterion ID | D7 |
| :---- | :---- |
| **Impact level** | Medium |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | A 'Best for' decision selector must appear after every comparison table or multi-option section. Format: one sentence per use case, specific audience named. |
| **Pass condition** | A 'Best for' selector sentence appears after every comparison table or multi-option section. |
| **Fail explanation** | 'Best for' selectors missing from comparison sections. AI engines use 'Best for' selectors to answer 'which is right for my situation' follow-up queries  a growing, high-commercial-intent query pattern. Without a 'Best for' statement, the article misses the follow-up citation path that comparison queries generate. |
| **How to fix** | After every comparison table, add 1–3 sentences in the format: 'Best for \[specific audience A\]: \[Option X\]. Best for \[specific audience B\]: \[Option Y\].' The audience must be specific  not 'beginners' but 'early-stage SaaS teams with under 10 sales reps.' |

| Section E: Failure Patterns Avoided |
| :---- |

*Tested anti-patterns that demonstrably reduce citation rates. These are not style preferences  each has a measurable impact on how often content is retrieved and cited.*

### **E1  No keyword stuffing (density ≤2%)**

| Criterion ID | E1 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Keyword density must be at or below 2%. The focus keyword must not appear more than once per paragraph. Natural density is approximately 0.8%. |
| **Pass condition** | Keyword density is ≤2% and focus keyword appears no more than once per paragraph. |
| **Fail explanation** | Keyword density exceeds 2% or focus keyword repeats within a paragraph. In testing, natural 0.8% density was cited 4x more frequently than 2.5% density. AI reads for meaning and entity relevance  it does not reward frequency. Repetition flags the content as optimised for keyword matching rather than user intent, reducing semantic quality signals. |
| **How to fix** | Calculate: (keyword count ÷ total word count) × 100\. If above 2%, remove repeated instances. Audit each paragraph  if the focus keyword appears twice, remove one. Replace repeated keywords with the named entity, a synonym, or simply rephrase to remove it. |

### **E2  No opening preamble**

| Criterion ID | E2 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | The article must not open with scene-setting prose. Phrases including 'In this article', 'In today's digital landscape', 'In recent years', 'Welcome to', 'This guide will cover', or any variation that delays the direct answer must be flagged. |
| **Pass condition** | First sentence is a direct answer to the H1. Zero preamble language detected. |
| **Fail explanation** | Opening preamble detected. The first 200 words are the highest-density citation zone  44.2% of all citations come from the first 30% of a page. Every word of preamble is a wasted extraction opportunity. AI skips preambles and retrieves the first direct answer it finds  if that is on a competitor's page, yours is bypassed. |
| **How to fix** | Read the first sentence. Ask: 'Does this directly answer the H1 question?' If not, delete everything before the direct answer. The first sentence must be the answer. No warm-up, no context-setting, no promise of what is coming. The answer comes first. |

### **E3  No dense prose blocks**

| Criterion ID | E3 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Every 200-word stretch of the article must contain at least one structural break: a bulleted list, numbered list, table, Q\&A block, or definition block. Any 200+ word stretch of unbroken prose must be flagged. |
| **Pass condition** | No 200-word stretch of unbroken prose detected. Every section contains at least one structural format. |
| **Fail explanation** | Dense prose blocks detected. Dense prose was the worst-performing format for AI inclusion in Chris Green's June 2025 experiment. Prose requires AI to parse, identify, and extract meaning  structured formats deliver it pre-packaged. Every 200-word prose block is a missed extraction opportunity. |
| **How to fix** | Scan every 200-word stretch. If no list, table, Q\&A, or definition block appears: add one. Minimum viable fix: convert 3 consecutive prose points into a bulleted list, or build a 3-row comparison table for any options mentioned. A structural break every 200 words is the minimum  every 150 words is optimal. |

| Section F: Technical & Schema |
| :---- |

*Controls whether AI crawlers can access the content and whether structured data signals are in place. Technical failures block all citation potential regardless of content quality.*

### **F1  Article \+ FAQPage \+ HowTo schema implemented and validated**

| Criterion ID | F1 |
| :---- | :---- |
| **Impact level** | Critical |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | Article schema must be present on every post. FAQPage schema must wrap all Q\&A and FAQ sections. HowTo schema must wrap all numbered process sections. All schema must be validated in Google Rich Results Test. |
| **Pass condition** | Article schema present. FAQPage schema on all Q\&A sections. HowTo schema on all numbered processes. All validated in Rich Results Test with no errors. |
| **Fail explanation** | Schema markup is missing or invalid. FAQPage schema achieves a 41% citation rate versus 15% without it  a 2.7x lift that increases further post-Gemini 2.0. HowTo schema is extracted directly by voice assistants and AI answer engines for step-format responses. Missing schema means structured content is treated as plain prose by AI systems. |
| **How to fix** | Implement: (1) Article schema on every post  non-negotiable baseline. (2) FAQPage schema wrapping the entire FAQ section. (3) HowTo schema wrapping every numbered step sequence. Validate all three at search.google.com/test/rich-results before publishing. Fix any errors flagged  invalid schema has no effect. |

### **F2  All 5 AI bots allowed in robots.txt; content in raw HTML; CWV passing**

| Criterion ID | F2 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | robots.txt must explicitly allow: GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, ClaudeBot. Critical article content must be visible in raw HTML source (not JavaScript-rendered). LCP must be under 2.5s and CLS under 0.1. |
| **Pass condition** | All 5 AI bots allowed in robots.txt. Content visible in raw HTML. LCP \<2.5s and CLS \<0.1. |
| **Fail explanation** | One or more AI crawlers are blocked or content is JS-rendered. A blocked crawler cannot index or cite the content  regardless of quality. JS-rendered content is frequently missed by AI crawlers that do not execute JavaScript. Core Web Vitals failures signal a poor user experience, which reduces the likelihood of citation in AI Overviews. |
| **How to fix** | Check robots.txt for all 5 bots: GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, ClaudeBot. Add any missing. View page source (Ctrl+U)  if the article body text does not appear in raw HTML, the content is JS-rendered and must be moved to server-side rendering. Run PageSpeed Insights for CWV. Fix LCP and CLS before publishing. |

### **F3  Visible 'Last updated' date \+ 30-day refresh \+ llms.txt updated**

| Criterion ID | F3 |
| :---- | :---- |
| **Impact level** | High |
| **Points** | 2 pts (Pass) / 0 pts (Fail) |
| **What to detect** | A visible 'Last updated: \[Month Year\]' date must appear on the page (not only in CMS metadata). A 30-day refresh calendar reminder must be set. llms.txt at the root domain must be updated to include this URL with entity and coverage description. |
| **Pass condition** | Visible 'Last updated' date on page. 30-day refresh reminder confirmed. llms.txt updated with this URL. |
| **Fail explanation** | Visible date or refresh process missing. 76.4% of ChatGPT's most-cited pages were updated within the past 30 days (Atlas Marketing, 200-article test). Content older than 90 days without updates loses citation rates by more than half regardless of original quality. AI crawlers read visible dates  metadata-only dates are not sufficient recency signals. |
| **How to fix** | Add 'Last updated: \[Month Year\]' as visible text on the page  in the byline, header, or opening section. Not just in CMS metadata. Set a calendar reminder 30 days from publish. On each refresh: update one stat, revise one example, add one new data point, and update the visible date. Add this page's URL and a brief entity/topic description to llms.txt at the root domain. |

## **Tool output specification**

When the scoring tool runs against a piece of content, it must output the following structure:

| Field | Description |
| :---- | :---- |
| **content\_url** | The URL or document identifier of the scored content |
| **scored\_at** | Timestamp of when the score was run |
| **total\_score** | Integer 0–40 |
| **grade** | One of: citation-ready / strong / needs-work / not-citation-ready |
| **criteria\_passed** | Count of criteria that passed |
| **criteria\_failed** | Count of criteria that failed |
| **critical\_failures** | List of criterion IDs with impact \= critical that failed  must be empty before publishing |
| **results** | Array of per-criterion results: { id, label, impact, points\_awarded, status: pass|fail, fail\_explanation (if fail), remediation (if fail) } |
| **priority\_actions** | Ordered list of failed criteria, Critical first, then High, then Medium  each with the remediation text |

*Re-score after every fix cycle. A criterion can change from fail to pass. The total score and grade update accordingly. Publish only when total score ≥ 30 and all Critical criteria show status: pass.*

