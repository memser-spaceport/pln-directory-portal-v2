import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { AiSearchScope } from '../ai-search/scope';
import type { TeamPostRole } from '../news-shared/teamPosts';
import { buildTeamAiScope, type TeamScopeInput } from './aiSearchScope';
import {
  MOCK_CANDIDATES,
  MOCK_CONTRIBUTIONS,
  MOCK_FOLLOWERS,
  MOCK_MEMBERS,
  MOCK_NEWS,
  MOCK_TEAM,
  MOCK_TEAM_ROLES,
  NEWS_COMMENT_THREADS,
} from './mocks';

/**
 * The team profile's Ask AI opens the AI Search page in a new tab with the
 * team attached (2026-11-02), as the member profile's does: AI Search is a
 * page of its own now (`ai-search-page`, /ai-search on develop).
 *
 * The scope's prompts follow the seat the profile was viewed in (no candidates
 * prompt for a member, no "our" or followers for a visitor, no roles prompt
 * once the roles are gone), so the URL carries that seat and the page rebuilds
 * the same scope from the same fixtures.
 */
export interface TeamAiSeat {
  view: TeamPostRole;
  /** Leads and admins of an active team: the candidates page is theirs. */
  canSeeCandidates: boolean;
  hasRoles: boolean;
}

export function teamAiSearchUrl(seat: TeamAiSeat, question?: string): string {
  const params = new URLSearchParams({ about: 'team', view: seat.view });
  if (seat.canSeeCandidates) params.set('cand', '1');
  if (!seat.hasRoles) params.set('roles', '0');
  if (question) params.set('q', question);
  return `/prototypes/ai-search-page?${params.toString()}`;
}

/** The scope `teamAiSearchUrl` describes. An answer's door opens the profile in a new tab. */
export function teamScopeFromParams(params: URLSearchParams): AiSearchScope {
  const view = (params.get('view') as TeamPostRole | null) ?? 'public';
  const name = MOCK_TEAM.name ?? 'this team';
  const profile = (hash = '', query = '') =>
    window.open(`/prototypes/team-profile${query}${hash}`, '_blank');
  return buildTeamAiScope({
    teamName: name,
    logo: getDefaultAvatar(name),
    members: MOCK_MEMBERS as unknown as TeamScopeInput['members'],
    roles: params.get('roles') === '0' ? null : (MOCK_TEAM_ROLES?.roles ?? null),
    candidatesFor: (uid) => MOCK_CANDIDATES[uid] ?? [],
    canSeeCandidates: params.get('cand') === '1',
    isTeamView: view !== 'public',
    followers: MOCK_FOLLOWERS,
    contributions: MOCK_CONTRIBUTIONS,
    news: MOCK_NEWS,
    commentsFor: (uid) => NEWS_COMMENT_THREADS[uid] ?? [],
    onOpen: (target) => {
      if (target.startsWith('candidates:')) profile('', `?candidates=${target.slice('candidates:'.length)}`);
      else if (target === 'followers' || target === 'news') profile();
      else profile(`#team-${target}`);
    },
  });
}
