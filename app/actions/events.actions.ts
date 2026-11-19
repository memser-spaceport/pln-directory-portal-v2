'use server';

import { revalidateTag } from 'next/cache';

import { ALL_EVENTS_CACHE_TAG } from '@/services/events/all-events.service';

/** After a submit, an edit or a delete: the All Events page reads the list again instead of its five-minute copy. */
export async function revalidateAllEvents(): Promise<void> {
  revalidateTag(ALL_EVENTS_CACHE_TAG, 'max');
}
