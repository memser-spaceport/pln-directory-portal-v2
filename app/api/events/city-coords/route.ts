import { NextResponse } from 'next/server';

import { getCityCoords } from '@/services/events/city-coords.service';

/** City positions for the All Events Map (LAB-3321): `{ [cityKey]: [lat, lng] }`, the same for every visitor. */
export async function GET() {
  try {
    return NextResponse.json(await getCityCoords(), {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('[events] city coordinates failed to load', error);
    return NextResponse.json({ error: 'City coordinates are unavailable' }, { status: 502 });
  }
}
