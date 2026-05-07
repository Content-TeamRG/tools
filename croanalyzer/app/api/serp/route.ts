import { NextRequest, NextResponse } from "next/server";
import {
  callSerpSearch,
  callSwot,
  parseJson,
} from "@/lib/anthropic";
import {
  buildSerpSearchSystem,
  buildSerpSearchUser,
  buildSwotSystemBlocks,
  buildSwotUser,
  type SerpSearchPayload,
} from "@/lib/serpPrompts";
import { fetchAndExtract, capWords } from "@/lib/extractContent";
import type { SerpRequest, SerpResult, SwotAnalysis, YourPagePosition } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 3);
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

const COMPETITORS_TO_FETCH = 5;
const COMPETITOR_FETCH_TIMEOUT_MS = 12000;
const PER_COMPETITOR_WORD_CAP = 1500;

async function fetchCompetitorWithTimeout(url: string) {
  return await Promise.race([
    fetchAndExtract(url),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("competitor fetch timeout")),
        COMPETITOR_FETCH_TIMEOUT_MS,
      ),
    ),
  ]);
}

export async function POST(req: NextRequest) {
  const started = Date.now();

  if (!process.env.GETTHIS) {
    return NextResponse.json(
      { error: "Server is missing API key" },
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

  let body: SerpRequest;
  try {
    body = (await req.json()) as SerpRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.keyword || !body.page_context) {
    return NextResponse.json(
      { error: "keyword and page_context are required" },
      { status: 400 },
    );
  }

  // Stage A — SERP search via Anthropic web_search tool
  let serp: SerpSearchPayload;
  try {
    const res = await callSerpSearch(
      buildSerpSearchSystem(),
      buildSerpSearchUser(body.keyword.trim()),
    );
    serp = parseJson<SerpSearchPayload>(res.text);
  } catch (e) {
    return NextResponse.json(
      { error: "SERP search failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  if (!serp.organic_competitors || serp.organic_competitors.length === 0) {
    return NextResponse.json(
      {
        error:
          "No organic landing-page-style competitors found for this keyword. Try a different keyword.",
      },
      { status: 400 },
    );
  }

  // Stage B prep — fetch competitor landing pages in parallel, drop the user's
  // own URL if it surfaced in results, time out aggressively, soft-fail per URL.
  const userHost = (() => {
    try {
      return body.page_url ? new URL(body.page_url).hostname : "";
    } catch {
      return "";
    }
  })();

  const candidates = serp.organic_competitors
    .filter((c) => {
      try {
        return userHost ? new URL(c.url).hostname !== userHost : true;
      } catch {
        return true;
      }
    })
    .slice(0, COMPETITORS_TO_FETCH);

  const fetched = await Promise.all(
    candidates.map(async (c) => {
      try {
        const out = await fetchCompetitorWithTimeout(c.url);
        const { text } = capWords(out.text, PER_COMPETITOR_WORD_CAP);
        return { ok: true as const, url: c.url, title: out.title || c.title, text };
      } catch (e) {
        return { ok: false as const, url: c.url, error: (e as Error).message };
      }
    }),
  );
  const okCompetitors = fetched.filter((f) => f.ok) as Array<{
    ok: true;
    url: string;
    title: string;
    text: string;
  }>;
  const failedCount = fetched.length - okCompetitors.length;

  if (okCompetitors.length === 0) {
    return NextResponse.json(
      {
        error:
          "Could not fetch any competitor landing pages — they may all be blocking crawlers.",
      },
      { status: 502 },
    );
  }

  // Stage B — SWOT analysis
  const userPageText = capWords(body.original_text || "", 1500).text;

  let swotPayload: { swot: SwotAnalysis; your_page_position: YourPagePosition };
  try {
    const res = await callSwot(
      buildSwotSystemBlocks(),
      buildSwotUser(
        serp.keyword_used || body.keyword,
        body.page_context,
        userPageText,
        okCompetitors.map((c) => ({ url: c.url, title: c.title, text: c.text })),
      ),
    );
    swotPayload = parseJson(res.text);
  } catch (e) {
    return NextResponse.json(
      { error: "SWOT analysis failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  const result: SerpResult = {
    keyword_used: serp.keyword_used || body.keyword,
    ads: serp.ads || [],
    organic_competitors: serp.organic_competitors,
    swot: swotPayload.swot,
    your_page_position: swotPayload.your_page_position,
    excluded_count: serp.excluded_count || 0,
    search_confidence: serp.search_confidence || "medium",
    meta: {
      duration_ms: Date.now() - started,
      competitors_fetched: okCompetitors.length,
      competitors_failed: failedCount,
    },
  };

  return NextResponse.json(result);
}
