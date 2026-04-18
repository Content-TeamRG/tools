import { NextRequest, NextResponse } from 'next/server';
import { parseHtml } from '@/lib/parser';
import { scoreContent } from '@/lib/scorer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body as { urls: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'Provide an array of URLs' }, { status: 400 });
    }

    if (urls.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 URLs per bulk request' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const fetchRes = await fetch(
          `${request.nextUrl.origin}/api/fetch-url?url=${encodeURIComponent(url)}`,
          { signal: AbortSignal.timeout(15000) }
        );

        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }

        const { html } = await fetchRes.json();
        const content = parseHtml(html);
        return scoreContent(content, url);
      })
    );

    const reports = results.map((result, i) => ({
      url: urls[i],
      success: result.status === 'fulfilled',
      report: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? (result.reason as Error).message : null,
    }));

    return NextResponse.json({ reports });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
