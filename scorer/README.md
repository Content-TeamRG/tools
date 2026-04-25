# Content Team Tools

Internal tooling for the RevvGrowth content team. Currently contains one tool: the **LLM Content Scorer** — a web app that automatically evaluates blog posts and articles for AI engine citation readiness.

---

## Table of Contents

1. [Why this tool exists](#1-why-this-tool-exists)
2. [Source documentation](#2-source-documentation)
3. [The 29 scoring criteria](#3-the-29-scoring-criteria)
4. [Architecture](#4-architecture)
5. [Tech stack decisions](#5-tech-stack-decisions)
6. [File structure](#6-file-structure)
7. [How the scoring engine works](#7-how-the-scoring-engine-works)
8. [Running locally](#8-running-locally)
9. [Deployment](#9-deployment)
10. [How to use the tool](#10-how-to-use-the-tool)
11. [Adding Supabase for team history](#11-adding-supabase-for-team-history)
12. [Design decisions](#12-design-decisions)
13. [Extending the tool](#13-extending-the-tool)

> **Repository layout**
> ```
> tools/
> ├── documentation/          ← Source playbook and scoring model (internal)
> ├── scorer/                 ← LLM Content Scorer web app (Next.js)
> └── vercel.json             ← Monorepo deploy config
> ```

---

## 1. Why this tool exists

AI engines — ChatGPT, Perplexity, Google AI Overviews — don't rank pages the way Google does. They retrieve and cite *chunks* of content (typically individual H2 sections of 200–500 words) based on how well those chunks answer a specific sub-query. A page can rank #1 on Google and never be cited by an AI engine, because the writing structure, heading format, stat attribution, and schema markup are evaluated completely differently.

The content team has a 29-criteria evaluation rubric that defines exactly what makes content citation-ready. Manually applying this rubric to every article takes 20–30 minutes per piece and is inconsistent across writers. This tool automates the entire evaluation in under 10 seconds, produces a 0–40 score with an A–D grade, flags every failure with the specific data point behind it, and gives the writer the exact text to add or change.

The goal is not to game AI engines. The goal is to write content that is genuinely more useful, more structured, and more verifiable — which is what AI engines reward.

---

## 2. Source documentation

Everything in this tool is derived from two internal documents in the `documentation/` folder:

### `Ranking on LLMs Playbook.md`
A 7-part guide covering how AI engines retrieve and cite content. Key findings that shaped the scoring criteria:
- 44.2% of all AI citations come from the **first 30% of a page** (AirOps, 1.2M citation study) — opening structure is critical
- 78.4% of ChatGPT citations with questions come from **question-format headings** — every H2 must be a user query
- Answer capsules (120–150 char standalone sentences after each H2) increase citations by **67%**
- Pages with FAQPage schema achieve **41% citation rate vs 15% without** — a 2.7x lift
- 89.6% of ChatGPT searches generate 2+ internal fan-out sub-queries — covering adjacent questions multiplies citation paths
- Named, attributed statistics increased citation rates by **41%** in a 50-article test (Atlas Marketing)
- 76.4% of ChatGPT's most-cited pages were updated within the past **30 days**
- Natural keyword density of **0.8% was cited 4x more** than 2.5% density — AI reads for meaning, not frequency

### `LLM Content Scoring Model`
The automated evaluation specification this tool implements directly. Defines all 29 criteria with exact pass/fail logic, the data point behind each failure, and the precise remediation instruction. Nothing has been added from outside this document — every rule in the scoring engine traces back to a finding in the playbook.

---

## 3. The 29 scoring criteria

Each criterion is binary (2 pts pass, 0 pts fail). Total possible: 40 points.

### Section A — Opening & Structure (5 criteria)
Controls whether the first retrieved chunk answers the broadest queries.

| ID | Criterion | Impact |
|----|-----------|--------|
| A1 | H1 is a direct question (contains `?`, starts with interrogative word) | Critical |
| A2 | TL;DR block present immediately after H1, 40–60 words, starts with focus keyword | High |
| A3 | Opening ≤200 words, BLUF structure, no preamble language | Critical |
| A4 | Every H2 is phrased as a question | Critical |
| A5 | First word of every H2 section paragraph echoes the entity named in the H2 | High |

### Section B — Section Quality (6 criteria)
Controls whether individual chunks are retrievable in isolation.

| ID | Criterion | Impact |
|----|-----------|--------|
| B1 | Answer capsule (120–150 chars, standalone, link-free) after every H2 | Critical |
| B2 | Every H2 section ends with an "In short:" summary block (40–60 words) | High |
| B3 | Every H2 section body is 200–400 words | Medium |
| B4 | Zero cross-section references ("as mentioned above", "see section X", etc.) | Critical |
| B5 | Conclusion is 5–7 standalone bullet points (not a paragraph) | High |
| B6 | Every acronym defined on first use within each section independently | Medium |

### Section C — Writing Quality (7 criteria)
Controls sentence-level clarity and information density.

| ID | Criterion | Impact |
|----|-----------|--------|
| C1 | No sentence exceeds 20 words | Medium |
| C2 | Every stat has named source + year + link. No vague attribution ("studies show") | Critical |
| C3 | One attributed stat every 150–200 words throughout the article | High |
| C4 | No vague time language ("recently", "nowadays", "in today's world") | Medium |
| C5 | Named entities on every reference — no "the platform", "this tool", "the company" | High |
| C6 | At least one original data point (own test, client case study, or named framework) | Critical |
| C7 | All paragraphs 2–3 sentences maximum, one idea each | Medium |

### Section D — Content Formats (7 criteria)
Controls whether the article uses the structural formats AI engines extract most reliably.

| ID | Criterion | Impact |
|----|-----------|--------|
| D1 | FAQ section with 5–8 questions and FAQPage schema applied | Critical |
| D2 | 4–5 fan-out/adjacent questions covered as H2s, H3s, or FAQ entries | High |
| D3 | Comparison table present for every X vs Y section | High |
| D4 | "What is X?" sections open with a 3-sentence definition block | High |
| D5 | Process content uses numbered steps + HowTo schema (not bullet points) | High |
| D6 | "Key Takeaways:" block (3–4 standalone bullets) after each major section | Medium |
| D7 | "Best for" selector sentence after every comparison table | Medium |

### Section E — Failure Patterns (3 criteria)
Anti-patterns with measurable negative impact on citation rates.

| ID | Criterion | Impact |
|----|-----------|--------|
| E1 | Keyword density ≤2%. Focus keyword appears max once per paragraph | High |
| E2 | No opening preamble ("In this article", "In today's digital landscape", etc.) | Critical |
| E3 | No 200+ word stretch of unbroken prose — structural break every 200 words minimum | High |

### Section F — Technical & Schema (3 criteria)
Controls whether AI crawlers can access the content and whether structured data is in place.

| ID | Criterion | Impact |
|----|-----------|--------|
| F1 | Article schema on every post. FAQPage schema on FAQ section. HowTo schema on steps | Critical |
| F2 | All 5 AI bots allowed in robots.txt. Content visible in raw HTML. Core Web Vitals passing | High |
| F3 | Visible "Last updated" date on page. 30-day refresh calendar set. llms.txt updated | High |

### Publishability gate
A score of 38/40 with two Critical failures is **not publication-ready**. To be publishable: score ≥30 AND zero Critical failures. Both conditions must be met.

---

## 4. Architecture

```
Browser
  │
  ├── GET /                    ← Analyzer input (URL or text paste)
  ├── GET /dashboard           ← Score history, charts, leaderboard
  ├── GET /bulk                ← Batch URL analyzer
  └── GET /report/[id]         ← Shareable saved report
        │
        ▼
  Next.js API Routes (serverless)
  │
  ├── POST /api/analyze        ← Single article scoring
  │     │
  │     ├── if URL → GET /api/fetch-url → fetch HTML via server-side proxy
  │     ├── if text → skip fetch
  │     │
  │     ├── lib/parser.ts      ← HTML/markdown → ParsedContent
  │     └── lib/scorer/        ← 29 rule checks → ScoreReport
  │
  ├── POST /api/bulk           ← Parallel scoring of up to 20 URLs
  │     └── calls /api/analyze per URL via Promise.allSettled
  │
  └── GET /api/fetch-url       ← Server-side CORS proxy
        └── fetches URL with proper User-Agent, returns raw HTML
              │
              ▼
        lib/db.ts              ← Persist ScoreReport to localStorage or Supabase
```

### Why server-side URL fetching?
Browsers block cross-origin requests (CORS). If the frontend fetched URLs directly, it would fail for most websites. The `/api/fetch-url` route runs on the server where CORS doesn't apply, fetches the HTML, and returns it to the client. This means the tool works on any public URL without needing browser extensions or CORS proxies.

### Why no AI API calls?
All 29 criteria are deterministic rule-based checks — regex patterns, word counts, structural analysis of the DOM. There is no ambiguity in whether a heading contains a question mark or a paragraph has more than 3 sentences. Using an LLM for evaluation would add cost, latency, and non-determinism to checks that have exact pass/fail definitions. The entire scoring engine runs in milliseconds with zero API cost.

---

## 5. Tech stack decisions

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 14 (App Router) | Server components + API routes in one repo. No separate backend needed. Vercel-native. |
| **Language** | TypeScript | The scoring engine has complex nested types. TypeScript catches mismatches at build time. |
| **Styling** | Tailwind CSS | Utility-first keeps the component files self-contained. No separate stylesheet files to maintain. |
| **Icons** | Lucide React | Consistent icon set, tree-shakeable, zero config. |
| **Charts** | Recharts | React-native, composable, good defaults for dark backgrounds. No D3 knowledge required. |
| **HTML parsing** | Cheerio | Server-side jQuery-style DOM parsing. Handles malformed HTML gracefully. Runs in Node (not browser). |
| **PDF export** | jsPDF + html2canvas | Captures the rendered report as a canvas image and writes it to PDF. No server-side rendering of PDF required. Runs entirely in the browser. |
| **Database** | Supabase (optional) | Free tier (500MB), built-in auth, instant REST API. Falls back to `localStorage` if not configured — meaning the tool works with zero backend setup. |
| **Hosting** | Vercel | Zero-config Next.js deployment. Free Hobby tier covers personal use. |
| **Cost** | $0 | No paid APIs, no paid services required for full functionality. |

---

## 6. File structure

```
scorer/
│
├── app/                            ← Next.js App Router pages and API routes
│   ├── page.tsx                    ← Home: analyzer input form, switches to report view
│   ├── dashboard/page.tsx          ← Dashboard: history, charts, leaderboard
│   ├── bulk/page.tsx               ← Bulk analyzer page
│   ├── report/[id]/page.tsx        ← Shareable report view (reads from localStorage)
│   ├── layout.tsx                  ← Root layout: NavBar + dark theme
│   ├── globals.css                 ← Base Tailwind styles + scrollbar utilities
│   │
│   └── api/
│       ├── analyze/route.ts        ← POST: accepts {url|text|html}, returns ScoreReport
│       ├── fetch-url/route.ts      ← GET ?url=: server-side CORS proxy
│       └── bulk/route.ts           ← POST: accepts {urls[]}, returns parallel ScoreReports
│
├── components/
│   ├── Analyzer.tsx                ← Input form (URL tab / text paste tab)
│   ├── ReportView.tsx              ← Full report UI: tabs, score card, criteria, actions
│   ├── SentenceHeatmap.tsx         ← Sentence length visualiser tab
│   ├── BulkAnalyzer.tsx            ← Bulk URL input + ranked results table
│   └── NavBar.tsx                  ← Top navigation bar
│
├── lib/
│   ├── parser.ts                   ← HTML → ParsedContent (via Cheerio) / markdown → ParsedContent
│   ├── db.ts                       ← Supabase client + localStorage fallback helpers
│   ├── utils.ts                    ← cn(), grade colours, formatters
│   │
│   └── scorer/
│       ├── types.ts                ← All TypeScript types (ScoreReport, CriterionResult, etc.)
│       ├── index.ts                ← Orchestrator: runs all 29 checks, builds final report
│       ├── section-a.ts            ← A1–A5: Opening & Structure rules
│       ├── section-b.ts            ← B1–B6: Section Quality rules
│       ├── section-c.ts            ← C1–C7: Writing Quality rules
│       ├── section-d.ts            ← D1–D7: Content Format rules
│       ├── section-e.ts            ← E1–E3: Failure Pattern rules
│       └── section-f.ts            ← F1–F3: Technical & Schema rules
│
├── supabase-schema.sql             ← SQL to run in Supabase to create the reports table
├── .env.local.example              ← Environment variable template
├── vercel.json                     ← Monorepo deploy config (repo root)
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. How the scoring engine works

### Step 1 — Parse
`lib/parser.ts` converts raw input into a `ParsedContent` object. Two parsers:

- **`parseHtml(html)`** — uses Cheerio to extract H1, all H2s, paragraphs, body text, sections (content between each H2), FAQ items, and JSON-LD schema types. Strips nav, footer, scripts before extraction.
- **`parseText(text)`** — processes markdown-style plain text. `# ` = H1, `## ` = H2, body text is split into sections accordingly.

The `ParsedContent` shape:
```ts
{
  h1: string
  h2s: string[]
  full_text: string
  opening_text: string        // first ~300 words
  sections: ContentSection[]  // each H2 + its body paragraphs
  faq_items: { question, answer }[]
  schema_types: string[]      // extracted from JSON-LD script tags
  sentences: string[]
  word_count: number
}
```

### Step 2 — Score
`lib/scorer/index.ts` calls all 29 rule functions and each returns a `CriterionResult`:
```ts
{
  id: string               // e.g. "A1"
  label: string            // human-readable name
  impact: 'critical' | 'high' | 'medium'
  section: string          // 'A' through 'F'
  points_awarded: 0 | 2
  status: 'pass' | 'fail'
  details?: string         // what was found (e.g. "3 of 7 H2s are not questions")
  fail_explanation?: string
  remediation?: string
}
```

Each rule function is a pure function: `(content: ParsedContent) => CriterionResult`. No state, no side effects. Examples of how rules are implemented:

```ts
// A1: H1 is a direct question
const pass = h1.includes('?') && /^(what|how|why|when|which|is|are|can|should)/i.test(h1)

// B4: No cross-section references
const hasCrossRef = /\b(as mentioned above|as covered earlier|see section)\b/i.test(text)

// C4: No vague time language
const hasVagueTime = /\b(recently|in recent years|nowadays|these days)\b/i.test(text)

// E1: Keyword density ≤2%
const density = (maxKeywordCount / totalWordCount) * 100
const pass = density <= 2
```

### Step 3 — Build report
The orchestrator aggregates all 31 `CriterionResult` objects into a `ScoreReport`:
```ts
{
  total_score: number           // 0–40
  grade: 'A' | 'B' | 'C' | 'D'
  grade_label: string
  criteria_passed: number
  criteria_failed: number
  critical_failures: string[]   // IDs of Critical criteria that failed
  is_publishable: boolean       // score >= 30 AND critical_failures.length === 0
  results: CriterionResult[]
  priority_actions: PriorityAction[]   // failed criteria sorted Critical → High → Medium
  section_scores: SectionScore[]       // per-section pass rate and score
  metadata: ContentMetadata            // word count, sentence stats, keyword density
}
```

### Grade thresholds
| Score | Grade | Meaning |
|-------|-------|---------|
| 37–40 | A — Citation-ready | Publish and monitor |
| 30–36 | B — Strong | Resolve remaining failures, especially Critical |
| 20–29 | C — Needs work | Do not publish until score reaches 30+ |
| 0–19  | D — Not citation-ready | Fundamental rebuild required |

---

## 8. Running locally

### Prerequisites
- Node.js 18+ and npm

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/Content-TeamRG/tools.git
cd tools/scorer

# 2. Install dependencies
npm install

# 3. (Optional) Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Skip this step to use localStorage instead of Supabase

# 4. Run the dev server
npm run dev

# 5. Open http://localhost:3000
```

### Building for production
```bash
npm run build
npm start
```

---

## 9. Deployment

The app is deployed on **Vercel** from the `main` branch. The `vercel.json` at the repo root tells Vercel to treat `scorer/` as the project root.

### Vercel setup
1. Import `Content-TeamRG/tools` on vercel.com
2. Set **Root Directory** to `scorer`
3. Framework will auto-detect as Next.js
4. Click Deploy

### Making the app publicly accessible
By default Vercel protects deployments behind Vercel authentication (team members only). To allow anyone with the link to use the tool:

**Project Settings → Deployment Protection → toggle Vercel Authentication OFF → Save**

### Environment variables on Vercel
Add these in Project Settings → Environment Variables if using Supabase:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Alternative: Netlify
If Vercel's org restrictions are an issue (Pro plan required for private org repos):
1. Import on netlify.com
2. Base directory: `scorer`
3. Build command: `npm run build`
4. Publish directory: `.next`

---

## 10. How to use the tool

### Analyzing a single article

**URL mode**
1. Go to the tool homepage
2. Ensure the **URL** tab is selected
3. Paste the full article URL (must be publicly accessible)
4. Click **Score my content**
5. The tool fetches the page, parses the HTML, runs all 29 checks, and returns the report in ~5 seconds

**Text / draft mode**
1. Switch to the **Paste text** tab
2. Paste your article in markdown format:
   - Use `# Heading` for H1
   - Use `## Heading` for H2 sections
3. Click **Score my content**
4. Useful for scoring drafts before publishing

### Reading the report

The report has four tabs:

**Overview tab**
- Section scores (A–F) shown as individual cards with progress bars
- Content metadata: word count, H2 count, average sentence length, keyword density

**All Criteria tab**
- Every criterion listed with pass (✓) or fail (✗)
- Filter by status (all / failed / passed) and by section (A–F)
- Click any failed criterion to expand the full failure explanation and exact remediation text

**Action Plan tab**
- All failures sorted by priority: Critical first, then High, then Medium
- Each action shows the data point behind the failure and the exact text to add or change
- Work through Critical failures first — these block publishability regardless of total score

**Sentence Heatmap tab**
- All sentences longer than 20 words are listed in red
- Shows word count per sentence and the exact sentence text
- Split each flagged sentence at a conjunction (and, but, which, that, because)

### Dashboard

The dashboard auto-saves every report you run. It shows:
- **Summary stats**: average score, publishable count, Grade A count, total critical failures
- **Grade distribution**: donut chart of A/B/C/D breakdown across all content
- **Top failing criteria**: bar chart of which criteria fail most frequently across your content library — useful for identifying systematic writing issues
- **Score trend**: line chart of scores over time (last 20 analyses)
- **Content leaderboard**: all articles ranked by score with publishability status dot (green = publishable, red = not)

Click the external link icon on any leaderboard row to open the full saved report.

### Bulk analyzer

1. Go to **/bulk** from the nav
2. Paste up to 20 URLs, one per line
3. Click **Analyze all**
4. Results appear ranked by score with section-level breakdown per URL on expand
5. Click **Export CSV** to download a spreadsheet of all scores — useful for reporting to stakeholders

### Sharing a report

Every report is automatically saved to localStorage with a unique ID. Click the **Share** button on any report to copy a link in the format `/report/[id]`. Note: localStorage is browser-specific. The link works on the same browser/device where the report was generated. For cross-device sharing, connect Supabase (see section 11).

### Exporting PDF

Click **PDF** on any report view. The tool captures the visible report as a high-resolution image and writes it to a PDF file. The file is named `llm-score-[grade]-[timestamp].pdf`. Use this for sending to stakeholders or attaching to content briefs.

---

## 11. Adding Supabase for team history

Without Supabase, reports are saved in the browser's localStorage — they disappear if you clear the browser or switch devices. Supabase makes reports persistent and shareable across the team.

### Setup
1. Create a free project at supabase.com
2. Open the SQL editor and run the contents of `scorer/supabase-schema.sql`:
```sql
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  report jsonb not null,
  share_token text unique
);
create index if not exists reports_share_token_idx on reports (share_token);
```
3. Go to Project Settings → API and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Add both to `.env.local` locally and to Vercel Environment Variables in production
5. Redeploy

Once configured, all reports are saved to Supabase automatically and shareable report links work across any device.

---

## 12. Design decisions

### Why rule-based and not LLM-based scoring?
The 29 criteria all have exact, deterministic pass/fail definitions. "Does the H1 contain a question mark?" is not a judgment call — it either does or it doesn't. Using an LLM for these checks would add:
- **Cost**: API calls per analysis
- **Latency**: 5–15 seconds per check vs milliseconds
- **Non-determinism**: the same article could score differently on different runs
- **Opacity**: harder to explain why a criterion failed

Rule-based scoring gives instant, reproducible, auditable results. The remediation text is precise ("Rewrite H1 as a direct question — must contain a question mark and begin with an interrogative word") rather than vague LLM suggestions.

### Why localStorage as the default storage?
The tool needed to be immediately useful with zero infrastructure setup. localStorage means a writer can open the app and start scoring in 30 seconds with no accounts, no database, no keys. Supabase is the upgrade path when the team needs cross-device history and shared dashboards.

### Why no auth by default?
This is an internal team tool. Adding authentication friction before the tool proves useful would reduce adoption. If the Vercel deployment protection is off, the URL is the access control — anyone with the link can use it. Auth can be layered in via Supabase Auth when needed.

### Why a monorepo structure?
The `tools/` repo is intended to hold multiple content team tools over time. The `scorer/` folder is the first. Each tool lives in its own subdirectory with its own `package.json`. The `vercel.json` at the root specifies which tool to deploy.

### Why `Promise.allSettled` for bulk analysis?
Bulk analysis fetches up to 20 URLs in parallel. `Promise.allSettled` (vs `Promise.all`) ensures that if one URL fails to fetch or parse, the rest of the batch still returns results. Each result has a `success` boolean and an `error` field, so the UI can show partial results cleanly.

### Why is `next.config.mjs` set to `images: { unoptimized: true }`?
Vercel's Image Optimization requires a paid plan for high-traffic use. Setting `unoptimized: true` avoids errors on the free tier while keeping the deployment working. The app doesn't use many images, so there's no meaningful performance tradeoff.

---

## 13. Extending the tool

### Adding a new scoring criterion
1. Decide which section it belongs to (A–F)
2. Open `lib/scorer/section-[x].ts`
3. Add a new exported function following this pattern:
```ts
export function scoreX9(content: ParsedContent): CriterionResult {
  const pass = /* your rule logic */;
  return {
    id: 'X9',
    label: 'Human-readable criterion name',
    impact: 'critical' | 'high' | 'medium',
    section: 'X',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    details: /* optional debug string */,
    fail_explanation: /* why this failure reduces citation probability */,
    remediation: /* exact fix instruction */,
  };
}
```
4. Import and call it in `lib/scorer/index.ts` inside the `scoreContent` function
5. The report, dashboard, and all UI update automatically — no other changes needed

### Adding a new page or feature
The app uses Next.js App Router. Add a new page by creating `app/[route]/page.tsx`. API routes go in `app/api/[route]/route.ts`.

### Switching from localStorage to Supabase
Follow section 11. The `lib/db.ts` file handles both — it checks if Supabase credentials are present and falls back to localStorage automatically. No code changes needed.

### Planned future features
- **Content Brief Generator** — auto-generate a blank AEO brief template from a keyword
- **Competitive Analysis** — score up to 5 competitor URLs side-by-side
- **Embeddable Score Badge** — SVG badge showing current grade, embeddable in CMS or Notion
- **Webhook / CI Integration** — POST endpoint for automated scoring on CMS publish
- **FAQ Auto-Generator** — extract candidate FAQ questions from article text
- **Before/After Compare** — diff two score reports to show improvement per criterion

---

## Maintainer notes

- The scoring logic lives entirely in `lib/scorer/`. Each section is one file. Each criterion is one exported function. Keep it that way — it makes the rules auditable and individually testable.
- The `documentation/` folder is the source of truth. If the playbook is updated, review each criterion against the new guidance and update the corresponding rule function.
- The tool has no tests currently. Priority additions: unit tests for each section scorer using sample content snippets, and integration tests for the `/api/analyze` endpoint.
- `package-lock.json` is committed. Use `npm ci` for reproducible installs in CI.
