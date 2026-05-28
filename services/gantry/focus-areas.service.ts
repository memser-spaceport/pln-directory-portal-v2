import { customFetch } from '@/utils/fetch-wrapper';

export interface GantryFocusAreaOption {
  uid: string;
  title: string;
  parentUid?: string | null;
}

export async function fetchGantryFocusAreas(): Promise<GantryFocusAreaOption[]> {
  const res = await customFetch('/api/gantry/focus-areas', { method: 'GET' }, false);
  if (!res?.ok) {
    throw new Error('Failed to fetch focus areas');
  }
  return res.json();
}
