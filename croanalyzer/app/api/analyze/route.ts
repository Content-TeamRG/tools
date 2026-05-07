import { NextRequest, NextResponse } from "next/server";
import {
  fetchAndExtract,
  splitSentences,
  capWords,
} from "@/lib/extractContent";
import {
  buildExtractionSystem,
  buildExtractionUser,
  buildScoringSystemBlocks,
  buildScoringUser,
} from "@/lib/prompts";
import { callExtraction, callScoring, parseJson } from "@/lib/anthropic";
import type { AnalyzeRequest, AnalyzeResult, PageContext } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 3);
const MAX_INPUT_WORDS = Number(process.env.MAX_INPUT_WORDS ?? 3000);
const MAX_SENTENCES = 200;

const ipBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_PER_MINUTE;
}

export async function POST(req: NextRequest) {
  const started = Date.now();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY" },
      { status: 500 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimitOk(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let title = "";
  let raw = "";
  let pageUrl: string | undefined = undefined;
  try {
    if (body.mode === "url") {
      if (!body.url) throw new Error("URL is required");
      const out = await fetchAndExtract(body.url);
      title = out.title;
      raw = out.text;
      pageUrl = body.url;
    } else if (body.mode === "text") {
      title = body.title ?? "";
      raw = body.text ?? "";
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Could not load page", detail: (e as Error).message },
      { status: 400 },
    );
  }

  const { text: capped, truncated } = capWords(raw, MAX_INPUT_WORDS);
  const sentencesAll = splitSentences(capped);
  const sentences = sentencesAll
    .slice(0, MAX_SENTENCES)
    .map((text, i) => ({ id: i, text }));
  if (sentences.length === 0) {
    return NextResponse.json(
      { error: "No analyzable text found on the page" },
      { status: 400 },
    );
  }

  let pageContext: PageContext;
  try {
    const ext = await callExtraction(
      buildExtractionSystem(),
      buildExtractionUser(title, capped),
    );
    pageContext = parseJson<PageContext>(ext.text);
  } catch (e) {
    return NextResponse.json(
      {
        error: "Page profile extraction failed",
        detail: (e as Error).message,
      },
      { status: 502 },
    );
  }

  let scored: Omit<AnalyzeResult, "page_context" | "meta">;
  try {
    const score = await callScoring(
      buildScoringSystemBlocks(),
      buildScoringUser(pageContext, sentences),
    );
    scored = parseJson(score.text);
  } catch (e) {
    return NextResponse.json(
      { error: "Scoring failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  const response: AnalyzeResult = {
    ...scored,
    page_context: pageContext,
    meta: {
      page_title: title,
      page_url: pageUrl,
      word_count: capped.split(/\s+/).filter(Boolean).length,
      sentence_count: sentences.length,
      duration_ms: Date.now() - started,
      truncated,
      original_text: capped,
    },
  };

  return NextResponse.json(response);
}
