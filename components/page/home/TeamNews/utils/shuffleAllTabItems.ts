import type { ITeamNewsItem } from '@/types/team-news.types';

// FNV-1a 32-bit string hash → numeric seed.
const hashStringToSeed = (input: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

// Mulberry32 PRNG: same seed always yields the same sequence.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Deterministic Fisher-Yates so the "All" tab feels mixed across focus areas
// instead of being dominated by whichever focus area sits first in the
// backend's grouped order — but stays identical on refresh as long as the
// underlying list of news hasn't changed.
export const shuffleAllTabItems = (items: ITeamNewsItem[]): ITeamNewsItem[] => {
  if (items.length < 2) return items;
  let latestCreatedAt = '';
  for (const item of items) {
    if (item.createdAt > latestCreatedAt) latestCreatedAt = item.createdAt;
  }
  // Mix in the count so adding/removing items also reshuffles, not just new
  // ingest runs.
  const seed = hashStringToSeed(`${latestCreatedAt}|${items.length}`);
  const rand = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
};
