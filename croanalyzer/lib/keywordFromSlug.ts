// Path segments that almost never carry the primary keyword on their own.
// We skip these when scanning right-to-left for a meaningful slug.
const STOP_SEGMENTS = new Set([
  "lp", "landing-page", "landing", "page", "pages",
  "home", "index", "main", "default",
  "p", "product", "products",
  "category", "categories", "c",
  "en", "us", "uk", "in", "global", "intl", "international",
  "www", "web", "site",
]);

export function keywordFromUrl(rawUrl: string, fallback = ""): string {
  try {
    const u = new URL(rawUrl);
    const segments = u.pathname
      .split("/")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .map((s) => s.replace(/\.(html?|php|aspx|jsp)$/, ""));

    if (segments.length === 0) {
      // Homepage URL — fall back to brand from hostname or to provided fallback.
      const brand = u.hostname.replace(/^www\./, "").split(".")[0];
      return fallback || normalize(brand);
    }

    // Walk right-to-left, take the first segment that's not a stop segment.
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (!STOP_SEGMENTS.has(seg) && seg.length > 1) {
        return normalize(seg);
      }
    }

    // All segments were stop words — take the last one regardless.
    return normalize(segments[segments.length - 1]) || fallback;
  } catch {
    return fallback;
  }
}

function normalize(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
