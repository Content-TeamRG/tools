import { NextRequest, NextResponse } from 'next/server';
import { parseHtml, parseText } from '@/lib/parser';
import { scoreContent } from '@/lib/scorer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, text, html } = body;

    if (!url && !text && !html) {
      return NextResponse.json(
        { error: 'Provide url, text, or html in the request body' },
        { status: 400 }
      );
    }

    let content;
    let finalUrl = url || '';

    if (html) {
      content = parseHtml(html);
    } else if (url) {
      // Fetch via our proxy
      const fetchRes = await fetch(
        `${request.nextUrl.origin}/api/fetch-url?url=${encodeURIComponent(url)}`
      );

      if (!fetchRes.ok) {
        const err = await fetchRes.json();
        return NextResponse.json({ error: err.error || 'Failed to fetch URL' }, { status: 502 });
      }

      const { html: fetchedHtml } = await fetchRes.json();
      content = parseHtml(fetchedHtml);
      finalUrl = url;
    } else {
      content = parseText(text);
    }

    const report = scoreContent(content, finalUrl);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
