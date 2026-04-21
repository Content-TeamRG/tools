# How This Was Built — A Complete Learning Guide

> This document explains everything that was built, every decision that was made, and every concept behind it — from scratch. Written so someone with no coding background can follow along and understand the full picture.

---

## PART 1 — The Big Picture

### What did we actually build?

We built a **web application**. A web app is software that runs in a browser — like Gmail, Notion, or Google Docs. You don't install it. You open a URL and use it.

This specific web app does one thing: it takes a blog post (either a URL or raw text) and evaluates it against 29 rules to produce a score from 0–40 and a grade from A to D. It tells you which rules the article failed, why each failure hurts your chances of being cited by AI engines, and exactly what to write to fix it.

### Why build a tool instead of just using a checklist?

The content team already had a checklist (the scoring model document). The problem with checklists:
- They take 20–30 minutes per article to apply manually
- Different people interpret rules differently — one person's "this counts as an answer capsule" is another person's "this is too long"
- They get skipped under deadline pressure
- They don't tell you *where* in the article the problem is

A tool removes all of that. It applies the same rules the same way every time, in under 10 seconds, and points to the exact failure.

### What are the three layers of every web app?

Every web application — no matter how simple or complex — has three layers:

```
1. FRONTEND  →  What the user sees and clicks (the browser)
2. BACKEND   →  Logic that runs on a server (invisible to users)
3. DATABASE  →  Where data is stored and retrieved
```

In our app:
- **Frontend**: The input form, score card, charts, dashboard — everything you see in the browser
- **Backend**: The scoring engine — the code that evaluates the 29 criteria and calculates the score
- **Database**: localStorage (in the browser) or Supabase — where reports are saved

### Why does a web app need a backend at all?

Two reasons in our case:

**Reason 1 — CORS (Cross-Origin Resource Sharing)**
When your browser tries to fetch a webpage from another website (e.g. you paste `https://example.com/article` into our tool), the browser blocks it. This is a security rule called CORS. It prevents websites from secretly reading each other's content.

To get around this, we run a small server-side piece of code that fetches the URL on behalf of the browser. Servers don't have CORS restrictions — only browsers do. This is our `/api/fetch-url` route.

**Reason 2 — Keeping logic centralised**
The scoring rules could technically run in the browser. But running them on the server means the rules can't be tampered with, and the same logic runs whether someone uses the web UI, calls the API directly, or triggers it from a CMS pipeline.

---

## PART 2 — The Technology Choices (and Why Each One)

Before writing a single line of code, choices had to be made about what tools to use. Here's every choice and the reasoning behind it.

### Next.js — The Framework

A **framework** is a pre-built structure for writing code. Instead of building everything from scratch, you follow the framework's conventions and it handles the plumbing for you.

**Next.js** is a framework for building web apps with JavaScript/TypeScript. It was chosen because:

1. It handles both the frontend (what users see) AND the backend (API routes) in a single project. Without Next.js, you'd need two separate projects — one for the UI and one for the server.
2. It's the official framework recommended by the React team (React is what we use to build the UI).
3. It deploys to Vercel in one click with zero configuration.
4. It's the industry standard for this type of tool in 2024–2025.

**Next.js App Router** is the newer way of organising files in Next.js (vs the older "Pages Router"). Files in the `app/` folder automatically become pages and API routes based on their path. For example:
- `app/page.tsx` → becomes the homepage at `/`
- `app/dashboard/page.tsx` → becomes the page at `/dashboard`
- `app/api/analyze/route.ts` → becomes the API endpoint at `/api/analyze`

### TypeScript — The Language

**JavaScript** is the programming language of the web. Every browser understands it. **TypeScript** is JavaScript with a type system added on top.

A **type system** means you declare what shape your data has. For example:

```ts
// Without TypeScript (JavaScript):
const report = { score: 35, grade: "B" }
// Nothing stops someone later doing report.grade = 12345 — a number, not a letter

// With TypeScript:
interface Report {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'  // can ONLY be one of these four values
}
// Now if someone writes report.grade = 12345, TypeScript throws an error at build time
```

TypeScript was chosen because the scoring engine has complex nested data structures — 29 criteria results, each with multiple fields, all feeding into a final report object. Without types, it's easy to accidentally pass the wrong data to the wrong function. TypeScript catches those mistakes before the code runs.

### Tailwind CSS — The Styling System

**CSS** is the language that controls how HTML elements look — colours, spacing, fonts, layout. Writing raw CSS means creating separate `.css` files with class names and rules.

**Tailwind CSS** is a different approach: instead of writing CSS, you apply pre-made utility classes directly in your HTML/JSX. For example:

```html
<!-- Raw CSS approach: you'd write a .card class in a separate file -->
<div class="card">...</div>

<!-- Tailwind approach: describe the styles directly -->
<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">...</div>
```

The Tailwind classes read like English: `bg-zinc-900` = background colour zinc-900, `rounded-xl` = extra-large border radius, `p-4` = padding of 4 units. This keeps all the visual logic in one place and removes the need to maintain separate CSS files.

### Recharts — The Charts Library

Charts (the line graph, donut chart, and bar chart on the dashboard) are complex to build from scratch. **Recharts** is a library of pre-built chart components for React. You pass it data and it renders the chart. We used it for the score trend line, grade distribution donut, and top failing criteria bar chart.

### Cheerio — The HTML Parser

When someone gives us a URL, we fetch the HTML of that page. HTML looks like this:

```html
<h1>What Is Variable Sales Compensation?</h1>
<p>Variable sales compensation is...</p>
<h2>How Does It Work?</h2>
```

We need to extract specific pieces: the H1, all H2s, all paragraphs, the body text, any JSON-LD schema. **Cheerio** lets us do this with jQuery-style selectors:

```ts
const h1 = $('h1').first().text()         // "What Is Variable Sales Compensation?"
const h2s = $('h2').map((_, el) => $(el).text()).get()
```

Cheerio is server-side only (it runs in Node.js, not in the browser). This is fine because our URL fetching happens in an API route, not in the browser.

### jsPDF + html2canvas — The PDF Export

**jsPDF** is a library that creates PDF files in the browser. **html2canvas** captures a section of the webpage as a canvas image (like a screenshot). Together, they:
1. Take a screenshot of the report view
2. Write that screenshot into a PDF file
3. Trigger a download in the browser

No server involved — the PDF is generated entirely in the user's browser.

### Supabase — The Database (Optional)

**Supabase** is a free, open-source alternative to Firebase. It provides:
- A **PostgreSQL database** (a type of relational database)
- A **REST API** auto-generated from the database schema
- **Authentication** (login/signup) if needed
- A **JavaScript SDK** (library) to interact with it from code

In our app, Supabase stores every score report as a JSON object in a `reports` table. Each row has an `id`, a `created_at` timestamp, the full `report` JSON, and a `share_token` for shareable links.

If Supabase isn't configured (no environment variables set), the app falls back to **localStorage** — a storage mechanism built into every browser that saves data as key-value pairs. localStorage is simpler but device-specific: data only exists in that browser, on that computer.

---

## PART 3 — The Repository Structure (What Every File Does)

A **repository** (repo) is a folder of code tracked by Git. Git is a version control system — it records every change ever made to every file, who made it, and why. This is how you can always go back to an earlier version.

Our repo is at `Content-TeamRG/tools` on GitHub. Here is every folder and file explained:

```
tools/                          ← The root of the repo
├── documentation/              ← The source documents the tool is based on
│   ├── Ranking on LLMs Playbook.md   ← The writing rules (the "why")
│   └── LLM Content Scoring Model     ← The 29 criteria spec (the "what to check")
│
├── scorer/                     ← The entire web app lives here
│   ├── app/                    ← Pages and API routes (Next.js App Router)
│   ├── components/             ← Reusable UI building blocks
│   ├── lib/                    ← Business logic (scoring engine, parser, database)
│   ├── package.json            ← List of all dependencies and scripts
│   ├── tailwind.config.ts      ← Tailwind configuration
│   ├── tsconfig.json           ← TypeScript configuration
│   └── next.config.mjs         ← Next.js configuration
│
├── vercel.json                 ← Tells Vercel how to deploy from this monorepo
└── README.md                   ← Documentation for the whole repo
```

### What is `package.json`?

`package.json` is the project's manifest file. It does two things:

1. **Lists all dependencies** — every external library the project uses (Recharts, Cheerio, jsPDF, etc.). When someone runs `npm install`, npm reads this file and downloads everything listed.

2. **Defines scripts** — shortcuts for common commands:
   - `npm run dev` → starts the local development server
   - `npm run build` → compiles the app for production
   - `npm start` → runs the production build

### What is `node_modules`?

When you run `npm install`, npm creates a `node_modules` folder and downloads all dependencies into it. This folder is never committed to Git (it's in `.gitignore`) because it can contain hundreds of thousands of files. Anyone who clones the repo just runs `npm install` to recreate it.

### What is `.gitignore`?

A file that tells Git which files and folders to ignore and never commit. In our project, `.gitignore` excludes:
- `node_modules/` — downloaded dependencies (huge, reproducible)
- `.next/` — the compiled build output (also reproducible)
- `.env.local` — environment variables (contains secrets, never commit these)

### What are environment variables?

**Environment variables** are configuration values that live outside the code. They're used for secrets (API keys, database passwords) that you don't want hardcoded in the code or committed to GitHub.

In our app, the Supabase credentials are environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The `NEXT_PUBLIC_` prefix means these values are safe to expose in the browser (they're public keys, not secrets). Variables without that prefix only exist on the server.

Locally, these go in `.env.local`. On Vercel, they're set in Project Settings → Environment Variables.

---

## PART 4 — The App Folder (Pages and API Routes)

```
app/
├── layout.tsx              ← Wraps every page (NavBar lives here)
├── globals.css             ← Global styles applied to the whole app
├── page.tsx                ← The homepage (/)
├── dashboard/
│   └── page.tsx            ← The dashboard (/dashboard)
├── bulk/
│   └── page.tsx            ← The bulk analyzer (/bulk)
├── report/
│   └── [id]/
│       └── page.tsx        ← A shareable report (/report/some-id-here)
└── api/
    ├── analyze/
    │   └── route.ts        ← POST /api/analyze
    ├── fetch-url/
    │   └── route.ts        ← GET /api/fetch-url
    └── bulk/
        └── route.ts        ← POST /api/bulk
```

### What is `layout.tsx`?

In Next.js, `layout.tsx` is a wrapper that surrounds every page. Think of it as a picture frame — all pages appear inside it. Our layout adds:
1. The `<NavBar>` component at the top of every page
2. The dark background colour
3. The HTML `lang` attribute and metadata

When you navigate from the homepage to the dashboard, the NavBar doesn't re-render — only the page content inside the layout changes. This makes navigation feel instant.

### What is a React component?

**React** is a library for building user interfaces. The core idea: instead of writing HTML directly, you write **components** — reusable pieces of UI that look like HTML but are actually JavaScript functions.

```tsx
// A simple React component
function ScoreCard({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <span className="text-5xl font-bold">{grade}</span>
      <span className="text-2xl">{score}/40</span>
    </div>
  )
}

// Used like this:
<ScoreCard score={35} grade="B" />
```

Components can receive **props** (properties) — data passed in from outside, like `score` and `grade` above. They can also have internal **state** — data that the component manages itself and that changes over time (like whether a dropdown is open or closed).

### What is `'use client'`?

In Next.js App Router, components are **Server Components** by default — they render on the server and send HTML to the browser. This is fast because the browser receives fully-formed HTML.

But some things only work in the browser: event handlers (button clicks), `useState`, `localStorage`, browser APIs. For those, you add `'use client'` at the top of the file. This tells Next.js: "run this component in the browser, not on the server."

In our app:
- Pages like `dashboard/page.tsx` are `'use client'` because they read from localStorage
- API routes (`route.ts` files) always run on the server — no `'use client'` needed there

### What is an API route?

An **API route** is a URL that returns data instead of a webpage. When you call `/api/analyze`, you don't get HTML — you get a JSON object with the score report.

```ts
// app/api/analyze/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()      // read the incoming data
  const { url, text } = body
  
  // ... run the scoring logic ...
  
  return NextResponse.json(report)       // send back JSON
}
```

The frontend calls this with `fetch()`:
```ts
const res = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com/article' })
})
const report = await res.json()
```

This is how the frontend and backend communicate. The frontend sends a request, the backend processes it and sends back data.

### The `[id]` in the report route

```
app/report/[id]/page.tsx
```

The square brackets make this a **dynamic route**. The `[id]` is a placeholder — it matches any value. So `/report/abc123`, `/report/xyz789`, and `/report/anything` all use this same page file. Inside the component, you can read the actual value:

```ts
const params = useParams()
const id = params.id  // "abc123", "xyz789", etc.
```

This is how shareable report links work — each saved report gets a unique ID, and that ID is part of the URL.

---

## PART 5 — The Parser (`lib/parser.ts`)

The parser is the first step in the scoring pipeline. It takes raw input (HTML from a URL, or plain text/markdown) and converts it into a structured `ParsedContent` object that the scoring engine can work with.

### Why does parsing need to happen?

The scoring engine needs to ask questions like:
- "What is the H1 heading?"
- "What are all the H2 headings?"
- "What is the text in the first 200 words?"
- "What are the body paragraphs of each section?"

A blob of raw HTML looks like this:
```html
<html><body><h1>What Is Sales Comp?</h1><p>Sales comp is...</p><h2>How does it work?</h2><p>It works by...</p></body></html>
```

The scoring rules can't work with that directly. The parser extracts the structured pieces and puts them in a clean object.

### `ParsedContent` — the output shape

```ts
interface ParsedContent {
  h1: string                    // The H1 heading text
  h2s: string[]                 // Array of all H2 heading texts
  full_text: string             // All body text, spaces normalised
  opening_text: string          // First ~300 words of the article
  sections: ContentSection[]    // Each H2 + its body content
  faq_items: { question, answer }[]   // Detected FAQ entries
  schema_types: string[]        // JSON-LD schema types found (e.g. "FAQPage")
  sentences: string[]           // Every sentence in the full text
  word_count: number
}

interface ContentSection {
  heading: string               // The H2 text
  body: string                  // All text after this H2 until the next H2
  word_count: number
  paragraphs: string[]
  sentences: string[]
}
```

### How `parseHtml` works (for URL input)

```ts
const $ = cheerio.load(html)

// Step 1: Remove noise — navigation, footer, scripts
$('nav, footer, header, script, style, aside').remove()

// Step 2: Extract H1
const h1 = $('h1').first().text().trim()

// Step 3: Extract all H2s
$('h2').each((_, el) => h2s.push($(el).text().trim()))

// Step 4: Extract sections
// For each H2, collect all sibling elements until the next H2
$('h2').each((_, h2El) => {
  let nextEl = $(h2El).next()
  while (nextEl.length && !nextEl.is('h2')) {
    body += nextEl.text()
    nextEl = nextEl.next()
  }
  sections.push({ heading, body, ... })
})

// Step 5: Extract JSON-LD schema types
$('script[type="application/ld+json"]').each((_, el) => {
  const json = JSON.parse($(el).text())
  schema_types.push(json['@type'])  // e.g. "FAQPage", "Article", "HowTo"
})
```

### How `parseText` works (for text/markdown input)

Markdown uses `#` for headings. The parser reads line by line:
```
# This Is The H1        ← starts with "# " → becomes h1
## This Is An H2        ← starts with "## " → starts a new section
Normal paragraph text   ← goes into the current section's body
```

### What is JSON-LD schema?

**JSON-LD** is a way to embed structured data in a webpage. It looks like this in the HTML source:
```html
<script type="application/ld+json">
{
  "@type": "FAQPage",
  "mainEntity": [...]
}
</script>
```

Search engines and AI crawlers read this to understand the page's structure. For criterion F1, we check whether Article, FAQPage, and HowTo schema are present. The parser finds all `<script type="application/ld+json">` tags and extracts the `@type` values.

---

## PART 6 — The Scoring Engine (`lib/scorer/`)

The scoring engine is the heart of the tool. It takes a `ParsedContent` object and runs 29 rule checks against it, returning a complete `ScoreReport`.

### The types (`types.ts`)

Before writing any logic, we defined the **data shapes** — what a criterion result looks like, what a full report looks like. This is TypeScript's main purpose: force you to define your data structures upfront.

Key types:
```ts
type ImpactLevel = 'critical' | 'high' | 'medium'
type CriterionStatus = 'pass' | 'fail'
type Grade = 'A' | 'B' | 'C' | 'D'

interface CriterionResult {
  id: string              // "A1", "B3", "F2", etc.
  label: string           // "H1 is a direct question"
  impact: ImpactLevel     // How much this failure hurts citation rates
  section: string         // "A" through "F"
  points_awarded: 0 | 2  // Binary — no partial credit
  status: CriterionStatus
  fail_explanation?: string    // The data point behind why this matters
  remediation?: string         // Exact text: what to write/change
  details?: string             // What was detected (e.g. "3 H2s are not questions")
}
```

The `?` after a field name means it's **optional** — it may or may not be present. `fail_explanation` only exists on failed criteria, so it's optional.

### How the section files are structured

Each section (A through F) is its own file. Each file exports one function per criterion. Every function has the same signature:

```ts
export function scoreA1(content: ParsedContent): CriterionResult {
  // 1. Run the check
  const pass = /* some condition */
  
  // 2. Return the result
  return {
    id: 'A1',
    label: 'H1 is a direct question',
    impact: 'critical',
    section: 'A',
    points_awarded: pass ? 2 : 0,
    status: pass ? 'pass' : 'fail',
    fail_explanation: 'Your H1 is a topic label, not a question...',
    remediation: 'Rewrite H1 as the exact question a user types...',
  }
}
```

This design — one function per criterion, pure functions with no side effects — makes each rule independently readable, testable, and modifiable. If the playbook changes criterion C4, you open `section-c.ts` and change one function.

### How the rules work (real examples)

**A1 — H1 is a direct question**
```ts
const INTERROGATIVES = /^(what|how|why|when|which|is|are|can|should|who|where)/i
const pass = h1.includes('?') && INTERROGATIVES.test(h1)
```
A **regex** (regular expression) is a pattern for matching text. `INTERROGATIVES.test(h1)` returns `true` if the H1 starts with any of those words. Both conditions must be true: the H1 must have a `?` AND start with an interrogative word.

**A4 — Every H2 is a question**
```ts
const nonQuestionH2s = h2s.filter(h => !h.includes('?'))
const pass = nonQuestionH2s.length === 0
```
`filter` returns a new array containing only elements that match a condition. We keep only the H2s that *don't* have a question mark. If that array is empty, all H2s are questions → pass.

**B3 — Section word count 200–400**
```ts
const thinSections = sections.filter(s => s.word_count < 200)
const longSections = sections.filter(s => s.word_count > 400)
const pass = thinSections.length === 0 && longSections.length === 0
```

**C4 — No vague time language**
```ts
const VAGUE_TIME = /\b(recently|in recent years|nowadays|in today's world|these days)\b/i
const hasVagueTime = VAGUE_TIME.test(text)
const pass = !hasVagueTime
```
`\b` in regex means "word boundary" — it ensures we match whole words, not parts of words. The `i` flag makes it case-insensitive.

**E1 — Keyword density ≤2%**
```ts
// Count frequency of every significant word
const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
const freq: Record<string, number> = {}
for (const word of words) {
  freq[word] = (freq[word] || 0) + 1
}
// Find the most repeated word
const maxCount = Math.max(...Object.values(freq))
const density = (maxCount / totalWords) * 100
const pass = density <= 2
```
We don't know what the "focus keyword" is, so we find the most-repeated significant word as a proxy. If even the most-used word is under 2% density, the article passes.

### The orchestrator (`index.ts`)

The orchestrator calls all 31 rule functions in sequence and assembles the final report:

```ts
export function scoreContent(content: ParsedContent, url: string): ScoreReport {
  const results: CriterionResult[] = [
    scoreA1(content),
    scoreA2(content),
    // ... all 29 criteria ...
    scoreF3(content),
  ]

  const totalScore = results.reduce((sum, r) => sum + r.points_awarded, 0)
  const grade = gradeFromScore(totalScore)  // 37-40=A, 30-36=B, 20-29=C, 0-19=D
  
  const criticalFailures = results
    .filter(r => r.impact === 'critical' && r.status === 'fail')
    .map(r => r.id)

  return {
    total_score: totalScore,
    grade,
    critical_failures: criticalFailures,
    is_publishable: totalScore >= 30 && criticalFailures.length === 0,
    results,
    priority_actions: buildPriorityActions(results),   // sorted Critical→High→Medium
    section_scores: buildSectionScores(results),       // per-section aggregates
    metadata: buildMetadata(content),                  // word count, sentence stats, etc.
  }
}
```

`reduce` is a JavaScript array method that accumulates a single value from an array. Here it adds up all `points_awarded` values to get the total score.

`filter` keeps only array elements matching a condition. Here it keeps only criteria that are both critical impact AND failed.

`.map(r => r.id)` transforms an array of objects into an array of just their IDs: `['A1', 'B4', 'C2', 'D1']`.

---

## PART 7 — The API Routes

API routes are the bridge between the frontend (browser) and the backend (scoring engine). They're HTTP endpoints — URLs that accept requests and return data.

### HTTP methods

HTTP (HyperText Transfer Protocol) is the language browsers and servers use to communicate. Every request has a **method** that describes the intent:

- `GET` — "give me data" (e.g. fetch a URL's HTML)
- `POST` — "here's data, process it" (e.g. submit an article for scoring)
- `PUT` — "update existing data"
- `DELETE` — "delete this data"

Our app uses GET and POST only.

### `/api/fetch-url` — the CORS proxy

```ts
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  // e.g. request URL is /api/fetch-url?url=https://example.com/article
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LLMScorer/1.0)',
    },
    signal: AbortSignal.timeout(15000),  // give up after 15 seconds
  })
  
  const html = await response.text()
  return NextResponse.json({ html, url })
}
```

**Why the custom User-Agent?** Some websites block requests that don't look like they come from a real browser. Setting a User-Agent string that looks like Chrome makes the request look legitimate.

**Why `AbortSignal.timeout(15000)`?** If a website is slow or unreachable, we don't want the server to hang forever waiting. 15 seconds is generous — if the page hasn't loaded by then, something is wrong.

**How the frontend calls it:**
```ts
// Frontend sends:
GET /api/fetch-url?url=https://example.com/article

// Server fetches the URL and sends back:
{ html: "<html>...</html>", url: "https://example.com/article" }
```

### `/api/analyze` — the main scoring endpoint

```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, text, html } = body
  
  let content
  
  if (html) {
    // HTML already provided (e.g. from bulk route)
    content = parseHtml(html)
  } else if (url) {
    // Fetch the URL first, then parse
    const fetchRes = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`)
    const { html: fetchedHtml } = await fetchRes.json()
    content = parseHtml(fetchedHtml)
  } else {
    // Plain text/markdown input
    content = parseText(text)
  }
  
  const report = scoreContent(content, url)
  return NextResponse.json(report)
}
```

**`encodeURIComponent`** — URLs can't contain certain characters (spaces, slashes, etc.) as query parameters. This function encodes them safely. `https://example.com/my article` becomes `https%3A%2F%2Fexample.com%2Fmy%20article`.

**Why accept `html` as a direct input?** The bulk route fetches multiple URLs in parallel and then calls this endpoint. To avoid fetching twice, the bulk route fetches the HTML itself and passes it directly to `/api/analyze`.

### `/api/bulk` — parallel batch scoring

```ts
export async function POST(request: NextRequest) {
  const { urls } = await request.json()
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const fetchRes = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`)
      const { html } = await fetchRes.json()
      const content = parseHtml(html)
      return scoreContent(content, url)
    })
  )
  
  return NextResponse.json({
    reports: results.map((result, i) => ({
      url: urls[i],
      success: result.status === 'fulfilled',
      report: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
    }))
  })
}
```

**`Promise.allSettled`** — JavaScript is asynchronous. When you `fetch` a URL, the code doesn't wait — it starts the fetch and moves on, coming back when it's done. A `Promise` represents "a value that will exist in the future."

`Promise.allSettled` takes an array of Promises (one per URL) and runs them **all in parallel** — all 20 fetches happen simultaneously, not one after another. It waits until every promise either succeeds (`fulfilled`) or fails (`rejected`), and returns all results.

The alternative, `Promise.all`, would throw an error the moment any single URL fails. `allSettled` collects all results, successes and failures alike. This is why bulk analysis works even if 2 of 20 URLs are unreachable — the other 18 still come back.

---

## PART 8 — The Components (UI Building Blocks)

### `Analyzer.tsx` — the input form

This is the first thing users see. It manages:
1. **Which tab is active** — URL or text paste
2. **The input value** — the URL string or the pasted text
3. **Loading state** — showing a spinner while scoring runs
4. **Error state** — showing an error message if the request fails

```ts
const [mode, setMode] = useState<'url' | 'text'>('url')
const [url, setUrl] = useState('')
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
```

`useState` is a React hook. A **hook** is a function that adds capabilities to a component. `useState` gives the component a piece of state — a value that, when it changes, causes the component to re-render (update the UI).

When the user clicks "Score my content":
```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()         // stop the browser's default form submission
  setLoading(true)           // show the spinner
  
  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ url })
  })
  
  const data = await res.json()
  onReport(data)             // pass the report up to the parent component
  setLoading(false)
}
```

`onReport` is a **callback prop** — a function passed from the parent (`page.tsx`) into this component. When the report is ready, `Analyzer` calls `onReport(data)` which tells the parent to switch from showing the input form to showing the report view.

### `ReportView.tsx` — the results display

This component receives the complete `ScoreReport` object and renders it across four tabs: Overview, All Criteria, Action Plan, and Sentence Heatmap.

It manages:
- Which tab is active
- Which criterion cards are expanded (a `Set` of IDs)
- Whether the share link was copied

The PDF export happens here:
```ts
async function handleExportPdf() {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')
  
  // Take a screenshot of the report div
  const canvas = await html2canvas(reportRef.current, {
    backgroundColor: '#09090b',
    scale: 1.5,   // higher resolution
  })
  
  // Write screenshot into PDF
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH)
  pdf.save(`llm-score-${report.grade}-${Date.now()}.pdf`)
}
```

**`await import('jspdf')`** — this is a **dynamic import**. Instead of loading jsPDF when the page first loads (which would make the initial page load slower), we only load it when the user actually clicks the PDF button. This is called **code splitting** and is a performance technique.

**`reportRef`** — a React `ref` is a way to get a direct reference to a DOM element (the actual HTML element in the browser). `html2canvas` needs this to know which element to screenshot.

### `dashboard/page.tsx` — the charts page

The dashboard uses `useEffect` — another React hook:

```ts
useEffect(() => {
  setReports(getLocalReports())
  setLoaded(true)
}, [])
```

`useEffect` runs code **after** the component renders. The empty array `[]` as the second argument means "only run this once, when the component first mounts." This is used to load data from localStorage on page load — you can't read localStorage during server-side rendering (there's no browser on the server), so you wait until the component is in the browser.

The Recharts charts receive data as plain JavaScript arrays:
```ts
const data = [
  { grade: 'A', count: 3 },
  { grade: 'B', count: 7 },
  { grade: 'C', count: 2 },
  { grade: 'D', count: 1 },
]
// <PieChart> reads this and draws the chart
```

---

## PART 9 — The Database Layer (`lib/db.ts`)

This file handles all data persistence — saving and retrieving reports.

### The dual-mode pattern

```ts
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
```

If the environment variables exist, create a Supabase client. If not, `supabase` is `null`. Every function checks this:

```ts
export async function saveReport(report: ScoreReport): Promise<StoredReport | null> {
  if (!supabase) {
    return null  // Supabase not configured, caller falls back to localStorage
  }
  
  const { data, error } = await supabase
    .from('reports')
    .insert({ report, share_token: generateToken() })
    .select()
    .single()
  
  return data
}
```

In `ReportView.tsx`, the save call looks like this:
```ts
useEffect(() => {
  const id = saveReportLocally(report)  // always saves to localStorage
  setSavedId(id)
}, [report])
```

The localStorage functions:
```ts
export function saveReportLocally(report: ScoreReport): string {
  const id = generateToken()              // random unique ID
  const existing = getLocalReports()      // read existing reports
  existing.unshift(stored)               // add new one to the front
  const trimmed = existing.slice(0, 100) // keep max 100 reports
  localStorage.setItem('llm_scorer_reports', JSON.stringify(trimmed))
  return id
}
```

`JSON.stringify` converts a JavaScript object to a string (localStorage can only store strings). `JSON.parse` converts it back.

`unshift` adds an item to the beginning of an array (vs `push` which adds to the end). We add new reports to the front so the most recent one appears first.

---

## PART 10 — The Deployment Pipeline

### What happens when you run `npm run build`?

Next.js compiles the entire application:
1. **TypeScript → JavaScript** — browsers don't understand TypeScript, so it's compiled to plain JavaScript
2. **JSX → JavaScript** — the HTML-like syntax in React components is compiled to `React.createElement()` calls
3. **Tailwind purge** — Tailwind scans all files and removes any CSS classes that aren't used, making the CSS file tiny
4. **Bundling** — all JavaScript files are combined and minified (whitespace removed, variable names shortened) into optimised chunks
5. **Static generation** — pages that don't need live data are pre-rendered to HTML at build time

The output goes into the `.next/` folder.

### What does Vercel actually do?

Vercel is a hosting platform built specifically for Next.js. When you push to the `main` branch on GitHub:

1. Vercel detects the push via a **webhook** (GitHub notifies Vercel automatically)
2. Vercel pulls the latest code
3. Runs `npm install` then `npm run build`
4. Deploys the output:
   - Static pages → served from a global CDN (Content Delivery Network — servers distributed worldwide so pages load fast from anywhere)
   - API routes → deployed as **serverless functions** (code that only runs when a request comes in, not a server running 24/7)
5. Assigns a URL (`your-project.vercel.app`)

### What is a serverless function?

A traditional server runs continuously, waiting for requests. A **serverless function** only exists for the duration of a single request. When `/api/analyze` receives a POST request:
1. Vercel spins up a container (a sandboxed environment) to run the function
2. The function executes, returns a response
3. The container is destroyed

This means you're not paying for idle time — you only pay for actual compute. On the free tier, the first 100GB of bandwidth and a generous number of function invocations per month are included.

### The `vercel.json` file

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

This file at the repo root tells Vercel how to build the project. Because our repo is a **monorepo** (a single repo containing multiple projects — in our case `documentation/` and `scorer/`), Vercel needs to know that the Next.js app is in the `scorer/` subfolder, not the root. The Root Directory setting in Vercel's UI (set to `scorer`) handles the directory change; `vercel.json` handles the build commands.

### Deployment Protection

By default, Vercel adds authentication to all deployments on team accounts — only Vercel team members can access them. To make the app public, you disable this in Project Settings → Deployment Protection.

---

## PART 11 — Key Decisions Explained

### Decision: Why 6 sections (A–F) instead of a flat list of 29 criteria?

The sections reflect different levels of the content hierarchy:
- Section A evaluates the **article level** (the opening, the title)
- Section B evaluates the **section level** (each H2 block)
- Section C evaluates the **sentence level** (word choice, attribution)
- Section D evaluates **formats** (tables, FAQs, step lists)
- Section E evaluates **anti-patterns** (things to avoid)
- Section F evaluates **technical infrastructure** (schema, crawlability)

Grouping by section makes it clear to a writer *where* in their workflow to focus. Section A problems are fixed at the outline stage. Section C problems are fixed during line editing. Section F problems are fixed in the CMS before publishing.

### Decision: Why is the scoring binary (0 or 2)? Why no partial credit?

The playbook's criteria are binary pass/fail by design. Either the H1 contains a question mark or it doesn't. Either there's a TL;DR block or there isn't. Partial credit would require subjective judgment — "how good is the TL;DR?" — which defeats the purpose of automated, consistent evaluation. The tool's value is its objectivity.

### Decision: Why is `is_publishable` based on BOTH score AND critical failures?

A piece could score 36/40 (Grade B) but have two Critical failures. Those Critical failures mean:
- No FAQ section with schema (D1) → missing the 41% citation rate lift
- Content opens with preamble (E2) → failing the highest-density citation zone

Publishing that content would be worse than its high score suggests. The gate requires *both* a minimum total score *and* zero Critical failures — you can't compensate for structural failures with lots of medium-importance wins.

### Decision: Why localStorage as the primary storage instead of a database?

Three reasons:
1. **Zero setup** — the tool works immediately with no accounts, no keys, no infrastructure. The fastest path to adoption.
2. **Privacy** — content drafts and scoring data never leave the user's machine unless they opt into Supabase.
3. **Cost** — localStorage is free with no limits (within browser storage quotas, typically 5–10MB).

The tradeoff: data is per-browser. Supabase is the opt-in upgrade for cross-device and cross-team history.

### Decision: Why import jsPDF dynamically instead of at the top of the file?

```ts
// Static import (bad for this use case):
import jsPDF from 'jspdf'       // loads into every user's browser on page load

// Dynamic import (what we did):
const { default: jsPDF } = await import('jspdf')  // only loads when PDF button is clicked
```

jsPDF is a ~300KB library. If it's statically imported, every user who visits the report page downloads 300KB even if they never click the PDF button. Dynamic importing means it only loads when needed — a significant performance improvement for most users.

### Decision: Why `Promise.allSettled` instead of `Promise.all` in bulk scoring?

```ts
// Promise.all — throws on first failure:
const results = await Promise.all(urls.map(fetchAndScore))
// If url[3] fails, you lose results for url[0], url[1], url[2] too

// Promise.allSettled — collects all results:
const results = await Promise.allSettled(urls.map(fetchAndScore))
// url[3] fails? You still get results for all 19 others
```

For a bulk tool where some URLs might be paywalled, slow, or broken, losing the entire batch because of one failure is unacceptable. `allSettled` degrades gracefully.

---

## PART 12 — Concepts Glossary

A reference for every technical term used in this document.

| Term | What it means |
|------|---------------|
| **API** | Application Programming Interface — a set of endpoints that let two programs communicate |
| **Async/Await** | JavaScript syntax for handling asynchronous operations (things that take time, like network requests) without blocking |
| **Bundle** | Multiple JavaScript files combined into one (or a few) for efficient browser delivery |
| **CDN** | Content Delivery Network — servers distributed worldwide that serve static files fast |
| **CORS** | Cross-Origin Resource Sharing — a browser security rule that blocks cross-site requests |
| **Component** | A reusable piece of React UI — a JavaScript function that returns HTML-like JSX |
| **Dependency** | An external library your project relies on (listed in `package.json`) |
| **Dynamic route** | A URL pattern like `/report/[id]` that matches multiple paths with a variable segment |
| **Environment variable** | A configuration value stored outside the code, used for secrets and settings |
| **Framework** | A pre-built structure for writing code (Next.js, Rails, Django) |
| **Git** | Version control system — tracks every change ever made to code |
| **Hook** | A React function (useState, useEffect) that adds capabilities to a component |
| **HTML** | HyperText Markup Language — the structure of a webpage |
| **HTTP** | Protocol for browser-server communication. Methods: GET, POST, PUT, DELETE |
| **JSON** | JavaScript Object Notation — a text format for structured data |
| **JSON-LD** | A way to embed structured data in HTML (schema markup) |
| **localStorage** | Browser storage for key-value pairs, persists across page reloads |
| **Monorepo** | A single Git repository containing multiple projects or apps |
| **Next.js** | A React framework with routing, API routes, and server-side rendering built in |
| **npm** | Node Package Manager — installs and manages JavaScript libraries |
| **Node.js** | JavaScript runtime that runs outside the browser (on servers) |
| **Promise** | A JavaScript object representing a future value (result of an async operation) |
| **Props** | Data passed from a parent component to a child component |
| **React** | A JavaScript library for building user interfaces using components |
| **Regex** | Regular Expression — a pattern for matching and searching text |
| **Repository** | A folder of code tracked by Git (usually hosted on GitHub) |
| **Serverless function** | Code that runs on-demand per request, not on a persistent server |
| **State** | Data inside a React component that changes over time and triggers re-renders |
| **TypeScript** | JavaScript with a type system — catches data shape errors at build time |
| **Tailwind CSS** | A CSS framework using utility classes instead of custom stylesheets |
| **useEffect** | React hook for running code after a component renders (data loading, subscriptions) |
| **useState** | React hook for managing state inside a component |
| **Webhook** | An automatic HTTP notification sent when an event happens (e.g. GitHub → Vercel on push) |

---

## PART 13 — The Build Process, Start to Finish

This is a chronological account of how the tool was built — every step in order.

### Step 1: Read the source documents
The two documents in `documentation/` were read in full. The playbook provided the *why* (the research and data points behind each rule). The scoring model provided the *what* (exact criteria, pass/fail definitions, remediation text). Nothing was invented — every rule in the tool is a direct implementation of the scoring model specification.

### Step 2: Choose the tech stack
Based on constraints (free, modern, maintainable, deployable in one click), the stack was chosen: Next.js 14, TypeScript, Tailwind CSS, Recharts, Cheerio, jsPDF, Supabase. Each choice was the simplest option that met the requirements.

### Step 3: Scaffold the project
```bash
npx create-next-app@14 scorer --typescript --tailwind --eslint --app
```
`create-next-app` is Next.js's project generator. It creates the folder structure, installs base dependencies, and configures TypeScript, Tailwind, and ESLint automatically.

### Step 4: Install additional dependencies
```bash
npm install cheerio recharts jspdf html2canvas @supabase/supabase-js lucide-react
```
Each library installed:
- `cheerio` → HTML parsing
- `recharts` → charts
- `jspdf` + `html2canvas` → PDF export
- `@supabase/supabase-js` → Supabase client
- `lucide-react` → icons

### Step 5: Define types first
Before writing any logic, `lib/scorer/types.ts` was written. Defining data shapes before logic is a TypeScript best practice — it forces clarity about what the system produces before you decide how it produces it.

### Step 6: Build the parser
`lib/parser.ts` was built next. The parser is the input layer — everything else depends on its output. Testing the parser first (mentally) against sample HTML confirmed the scoring engine would have clean data to work with.

### Step 7: Build the scoring sections (A–F)
Each section was built independently in its own file. This was done deliberately — each file is self-contained and can be read, modified, or tested without touching the others.

### Step 8: Build the orchestrator
`lib/scorer/index.ts` imports all 29 rule functions and assembles the final report. Once the sections were stable, the orchestrator was straightforward.

### Step 9: Build the API routes
With the scoring engine complete, the API routes were thin wrappers: receive input → call parser → call scorer → return result.

### Step 10: Build the UI
Components were built from the inside out:
1. `Analyzer.tsx` — the input form (simplest, no dependencies)
2. `ReportView.tsx` — the report display (depends on ScoreReport type)
3. `SentenceHeatmap.tsx` — the heatmap tab
4. `NavBar.tsx` — the navigation
5. `dashboard/page.tsx` — the charts and leaderboard
6. `BulkAnalyzer.tsx` — the bulk input and results

### Step 11: Fix TypeScript and ESLint errors
Running `npm run build` surfaced type errors (Recharts formatter types) and ESLint warnings (unused imports, unescaped apostrophes in JSX). These were fixed one by one until the build was clean.

### Step 12: Add Supabase and localStorage
`lib/db.ts` was written with the dual-mode pattern — Supabase when configured, localStorage always as fallback.

### Step 13: Deploy
The `vercel.json` was added to the repo root, the feature branch was merged to `main`, and the project was imported on Vercel. Several configuration issues were debugged (wrong branch, `cd scorer` duplication, deployment protection) until the app was live and publicly accessible.

### Step 14: Write documentation
`README.md` was written covering architecture, every file, every decision, and a usage guide. This `HOW-THIS-WAS-BUILT.md` was written as a learning resource.

---

*This document was written to be read top to bottom by someone who wants to understand not just what the tool does, but how and why every part of it was built. If anything is unclear, the best next step is to open the relevant file in the `scorer/` directory and read the actual code alongside this explanation.*
