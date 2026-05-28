import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface FocusAreaRow {
  uid: string;
  title: string;
  parentUid?: string | null;
}

export async function GET() {
  const res = await fetch(`${process.env.DIRECTORY_API_URL}/v1/focus-areas`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch focus areas' }, { status: res.status });
  }

  const data = (await res.json()) as FocusAreaRow[];
  const items = Array.isArray(data)
    ? data
        .filter((fa) => !fa.parentUid)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ uid, title, parentUid }) => ({ uid, title, parentUid: parentUid ?? null }))
    : [];

  return NextResponse.json(items);
}
