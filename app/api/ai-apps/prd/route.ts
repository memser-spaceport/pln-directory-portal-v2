import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// The one-pager is a direct S3 URL (LAB-2101), and that bucket has no CORS
// policy, so the browser can't read it via a same-origin-restricted fetch.
// This route fetches it server-side (no CORS involved) and hands the text
// back to the client. Scoped tight to avoid turning this into an open SSRF
// proxy: only S3 hosts, only the ai-app-prds/ prefix the backend writes to.
const S3_HOSTNAME_RE = /^[a-z0-9.-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i;
const PRD_PATH_PREFIX = '/ai-app-prds/';
const MAX_PRD_BYTES = 2 * 1024 * 1024;

function isAllowedPrdUrl(url: URL): boolean {
  return url.protocol === 'https:' && S3_HOSTNAME_RE.test(url.hostname) && url.pathname.startsWith(PRD_PATH_PREFIX);
}

/** Shared by GET and HEAD: parses/validates the `url` param, or returns the 400 response to send. */
function parsePrdUrl(request: NextRequest): { url: URL } | { errorResponse: NextResponse } {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return { errorResponse: NextResponse.json({ error: 'Missing url parameter' }, { status: 400 }) };
  }

  let prdUrl: URL;
  try {
    prdUrl = new URL(rawUrl);
  } catch {
    return { errorResponse: NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 }) };
  }

  if (!isAllowedPrdUrl(prdUrl)) {
    return { errorResponse: NextResponse.json({ error: 'Url not allowed' }, { status: 400 }) };
  }

  return { url: prdUrl };
}

/** Used by the edit modal's existing-file preview card to show an accurate size without downloading the file. */
export async function HEAD(request: NextRequest) {
  const parsed = parsePrdUrl(request);
  if ('errorResponse' in parsed) {
    return new NextResponse(null, { status: parsed.errorResponse.status });
  }

  try {
    const upstream = await fetch(parsed.url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) {
      return new NextResponse(null, { status: 502 });
    }

    const contentLength = upstream.headers.get('content-length');
    return new NextResponse(null, { status: 200, headers: contentLength ? { 'content-length': contentLength } : {} });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const parsed = parsePrdUrl(request);
  if ('errorResponse' in parsed) {
    return parsed.errorResponse;
  }
  const prdUrl = parsed.url;

  try {
    const upstream = await fetch(prdUrl, { signal: AbortSignal.timeout(10_000) });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'One-pager could not be loaded' }, { status: 502 });
    }

    const contentLength = Number(upstream.headers.get('content-length') ?? 0);
    if (contentLength > MAX_PRD_BYTES) {
      return NextResponse.json({ error: 'One-pager is too large to display' }, { status: 502 });
    }

    const content = await upstream.text();
    if (content.length > MAX_PRD_BYTES) {
      return NextResponse.json({ error: 'One-pager is too large to display' }, { status: 502 });
    }

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'One-pager could not be loaded' }, { status: 502 });
  }
}
