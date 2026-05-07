import * as cheerio from "cheerio";

export async function fetchAndExtract(
  url: string,
): Promise<{ title: string; text: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CROAnalyzer/0.1; +https://github.com/)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status}`);
  const html = await res.text();
  return extractFromHtml(html);
}

const BLOCK_TAGS = new Set([
  "p", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "div", "section", "article", "header", "main", "aside",
  "td", "th", "tr", "blockquote", "button", "label", "br",
  "figcaption", "summary",
]);

function walkText(el: any, parts: string[]): void {
  if (!el) return;
  if (el.type === "text") {
    if (el.data) parts.push(el.data);
    return;
  }
  if (el.type === "tag") {
    const isBlock = BLOCK_TAGS.has(el.name);
    if (isBlock) parts.push("\n");
    if (el.children) {
      for (const child of el.children) walkText(child, parts);
    }
    if (isBlock) parts.push("\n");
  }
}

export function extractFromHtml(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, link, meta").remove();

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  $("nav, footer, [role='navigation'], [aria-hidden='true']").remove();

  const root =
    $("main").length > 0
      ? $("main")
      : $("article").length > 0
        ? $("article")
        : $("[role='main']").length > 0
          ? $("[role='main']")
          : $("body");

  const parts: string[] = [];
  root.each((_, el) => walkText(el, parts));

  const body = parts
    .join("")
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((s) => (/[.!?:]$/.test(s) ? s : s + "."))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return { title, text: body };
}

export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?]+[.!?]+["')\]]?|\S[^.!?]*$/g) ?? [cleaned];
  return parts
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && /[A-Za-z]/.test(s));
}

export function capWords(
  text: string,
  maxWords: number,
): { text: string; truncated: boolean } {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { text, truncated: false };
  return { text: words.slice(0, maxWords).join(" "), truncated: true };
}
