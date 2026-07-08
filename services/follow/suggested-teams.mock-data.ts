import type { ISuggestedTeam, ITeamNewsItem } from '@/types/team-news.types';

export interface CandidateTeam {
  id?: string;
  name?: string | null;
  logo?: string | null;
  industryTags?: { uid: string; title: string }[];
}

// Deterministic string hash — used only to seed a stable-per-day sort order, not for
// anything security-sensitive.
function seedHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// This codebase's ITeam/ITeamResponse types carry no `focusAreas` field, and the
// trimmed team-list response (app/actions/teams.actions.ts's getTeamList) only
// includes `industryTags` — not `communityAffiliations`. So this mock derives
// "shared Focus Area" from news items (real data, already in memory) and "shared
// Industry Tag" from the candidate pool, but never produces a 'community-affiliation'
// reason — there's no reliably available data source for it yet. Revisit once a
// fuller teams payload or the real LAB-2094 endpoint is available.
export function computeMockSuggestions(
  candidates: CandidateTeam[],
  memberTeamUid: string | null,
  followedTeamUids: string[],
  recentNewsItems: ITeamNewsItem[],
  seed: string,
): ISuggestedTeam[] {
  const followedSet = new Set(followedTeamUids);
  const referenceTeamUids = new Set(followedTeamUids);
  if (memberTeamUid) referenceTeamUids.add(memberTeamUid);

  const teamsWithRecentNews = new Set(recentNewsItems.map((i) => i.teamUid));

  const referenceFocusAreas = new Set(
    recentNewsItems.filter((i) => referenceTeamUids.has(i.teamUid)).flatMap((i) => i.focusAreas),
  );
  const referenceIndustryTagUids = new Set(
    candidates
      .filter((c) => c.id && referenceTeamUids.has(c.id))
      .flatMap((c) => (c.industryTags ?? []).map((t) => t.uid)),
  );

  const scored = candidates
    .filter((c) => c.id && !followedSet.has(c.id) && c.id !== memberTeamUid && teamsWithRecentNews.has(c.id))
    .map((c): ISuggestedTeam | null => {
      const candidateFocusAreas = recentNewsItems.filter((i) => i.teamUid === c.id).flatMap((i) => i.focusAreas);
      const sharedFocusArea = candidateFocusAreas.find((fa) => referenceFocusAreas.has(fa));
      if (sharedFocusArea) {
        return {
          uid: c.id!,
          name: c.name ?? 'Unnamed team',
          logoUrl: c.logo ?? null,
          reason: sharedFocusArea,
          reasonType: 'focus-area',
        };
      }

      const sharedIndustryTag = (c.industryTags ?? []).find((t) => referenceIndustryTagUids.has(t.uid));
      if (sharedIndustryTag) {
        return {
          uid: c.id!,
          name: c.name ?? 'Unnamed team',
          logoUrl: c.logo ?? null,
          reason: sharedIndustryTag.title,
          reasonType: 'industry-tag',
        };
      }

      return null;
    })
    .filter((s): s is ISuggestedTeam => s !== null);

  // Deterministic, reload-surviving order for a given seed (date + member) — not a
  // real relevance ranking, just enough to satisfy "stable within the same day".
  return scored.sort((a, b) => seedHash(`${seed}:${a.uid}`) - seedHash(`${seed}:${b.uid}`));
}
