import { NextResponse } from 'next/server';
import { getCurrentRoundStats } from '@/services/plaa/rounds.service';

/** Public, no-auth passthrough — same call app/alignment-asset/page.tsx makes server-side,
 * proxied here so client components (e.g. the persistent PlaaSnapshotBar) can read it too. */
export async function GET() {
  const { data, error } = await getCurrentRoundStats();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch round stats' }, { status: 502 });
  }

  return NextResponse.json(data);
}
