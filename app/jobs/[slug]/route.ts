import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['redirect', 'unsubscribed']);

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filename = `${slug}.pdf`;
  const pdfPath = path.join(process.cwd(), 'public', 'jobs', filename);

  try {
    const pdf = await readFile(pdfPath);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Job description not found' }, { status: 404 });
  }
}
