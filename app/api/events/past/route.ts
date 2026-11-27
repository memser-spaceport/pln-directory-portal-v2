import { NextResponse } from 'next/server';

import { getStartedEvents } from '@/services/events/past-events.service';

// Reads the clock on every call: never prerendered at build time.
export const dynamic = 'force-dynamic';

/**
 * Past events for the All Events page (LAB-3418), with those about to be, the same for everyone. `private`:
 * the service already keeps the list on the server for everyone, so a shared cache would only add its own age to it;
 * the visitor's browser alone keeps the answer.
 */
export async function GET() {
  try {
    return NextResponse.json(
      { items: await getStartedEvents() },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    );
  } catch (error) {
    console.error('[events] past events failed to load', error);
    return NextResponse.json(
      { error: 'Past events are unavailable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
