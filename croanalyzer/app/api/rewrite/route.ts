import { NextRequest, NextResponse } from "next/server";
import { callRewrite, parseJson } from "@/lib/anthropic";
import {
  buildRewriteSystemBlocks,
  buildRewriteUser,
} from "@/lib/rewritePrompts";
import type {
  RewriteMode,
  RewriteRequest,
  RewriteResult,
} from "@/lib/types";

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

  let body: RewriteRequest;
  try {
    body = (await req.json()) as RewriteRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.original_text || !body.page_context) {
    return NextResponse.json(
      { error: "original_text and page_context are required" },
      { status: 400 },
    );
  }

  const mode: RewriteMode = body.mode || "mistakes";
  const findings = body.findings || [];
  const weakSentences = body.weak_sentences || [];
  const serp = body.serp;

  if ((mode === "serp" || mode === "both") && !serp) {
    return NextResponse.json(
      {
        error:
          "Mode requires SERP analysis input. Run the SERP analysis first, then retry.",
      },
      { status: 400 },
    );
  }

  if (mode === "mistakes" && findings.length === 0 && weakSentences.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nothing to fix in 'mistakes' mode — no findings or weak sentences provided.",
      },
      { status: 400 },
    );
  }

  let parsed: Omit<RewriteResult, "meta" | "mode_used">;
  try {
    const res = await callRewrite(
      buildRewriteSystemBlocks(mode),
      buildRewriteUser(
        mode,
        body.page_context,
        body.original_text,
        findings,
        weakSentences,
        serp,
        body.page_title || "",
      ),
    );
    parsed = parseJson(res.text);
  } catch (e) {
    return NextResponse.json(
      { error: "Rewrite failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  const originalWords = body.original_text.split(/\s+/).filter(Boolean).length;
  const rewrittenWords = (parsed.rewritten_text || "")
    .split(/\s+/)
    .filter(Boolean).length;

  const result: RewriteResult = {
    rewritten_text: parsed.rewritten_text || "",
    change_log: parsed.change_log || [],
    applied_findings_count: parsed.applied_findings_count || 0,
    mode_used: mode,
    meta: {
      duration_ms: Date.now() - started,
      original_word_count: originalWords,
      rewritten_word_count: rewrittenWords,
    },
  };

  return NextResponse.json(result);
}
