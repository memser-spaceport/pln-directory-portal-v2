import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFollowTeam } from './useFollowTeam';
import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { QueryData } from '@/services/teams/hooks/useInfiniteTeamsList';
import { FOLLOWING_TEAMS_COUNT_KEY } from './useFollowingTeamsCount';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';

interface UseToggleTeamFollowInListOptions {
  team: ITeam;
  searchParams: ITeamsSearchParams;
}

type ListCache = InfiniteData<QueryData, number>;

/**
 * Follow/unfollow toggle for a single card in the /teams grid. Unlike TeamFollowBlock (which owns
 * an exclusive single-record cache key), this patches a cache shared by every visible card, so
 * updates are scoped to this one team via a functional updater rather than a whole-cache snapshot
 * restore — a blind restore would clobber whatever a sibling card's concurrent mutation just wrote.
 * Must be called from inside a real per-card component instance (one per team), never from a
 * `.map()` callback, so `isPending` and the mutation itself stay scoped to the clicked card.
 */
export function useToggleTeamFollowInList({ team, searchParams }: UseToggleTeamFollowInListOptions) {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const isHydrated = useCurrentUserStore((s) => s.isHydrated);
  const { mutate, isPending } = useFollowTeam();
  const { onTeamFollowed, onTeamUnfollowed, onTeamFollowFailed } = useFollowAnalytics();

  const isFollowingOnly = searchParams.followingOnly === 'true';

  const patchTeam = (teamUid: string, updater: (t: ITeam) => ITeam | null) => {
    queryClient.setQueriesData<ListCache>({ queryKey: [TeamsQueryKeys.GET_TEAMS_LIST] }, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => {
          if (!page.items.some((t) => t.id === teamUid)) return page;
          const nextItems = page.items
            .map((t) => (t.id === teamUid ? updater(t) : t))
            .filter((t): t is ITeam => t !== null);
          return { ...page, items: nextItems };
        }),
      };
    });
  };

  const reinsertTeam = (teamToReinsert: ITeam) => {
    queryClient.setQueriesData<ListCache>({ queryKey: [TeamsQueryKeys.GET_TEAMS_LIST] }, (old) => {
      if (!old) return old;
      const alreadyPresent = old.pages.some((page) => page.items.some((t) => t.id === teamToReinsert.id));
      if (alreadyPresent) return old;
      const [firstPage, ...rest] = old.pages;
      if (!firstPage) return old;
      return { ...old, pages: [{ ...firstPage, items: [teamToReinsert, ...firstPage.items] }, ...rest] };
    });
  };

  const bumpFollowingCount = (delta: number) => {
    queryClient.setQueryData<number>(FOLLOWING_TEAMS_COUNT_KEY, (current) => Math.max(0, (current ?? 0) + delta));
  };

  const toggleFollow = () => {
    // Narrow UX backstop for the store-population race (StoreInitializer seeds via an effect,
    // not synchronously) — not a security boundary. The follow button only renders when the
    // server already says isLoggedIn, so a genuinely anonymous click can't reach here.
    if (!isHydrated || !currentUser) return;

    const willFollow = !team.isFollowed;
    const removeFromFollowingTab = !willFollow && isFollowingOnly;

    patchTeam(team.id, (t) => (removeFromFollowingTab ? null : { ...t, isFollowed: willFollow }));
    bumpFollowingCount(willFollow ? 1 : -1);

    const revert = () => {
      if (removeFromFollowingTab) {
        reinsertTeam(team);
      } else {
        patchTeam(team.id, (t) => ({ ...t, isFollowed: team.isFollowed }));
      }
      bumpFollowingCount(willFollow ? -1 : 1);
    };

    mutate(
      { teamUid: team.id, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: (data) => {
          if (!data) {
            revert();
            return;
          }
          if (willFollow) {
            onTeamFollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'teams-directory' });
          } else {
            onTeamUnfollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'teams-directory' });
          }
        },
        onError: () => {
          revert();
          onTeamFollowFailed({
            teamUid: team.id,
            teamName: team.name ?? '',
            source: 'teams-directory',
            action: willFollow ? 'follow' : 'unfollow',
          });
        },
        onSettled: () => {
          // The optimistic patch only flips/removes teams already present in a given cached
          // tab's page — it can't know how a newly-followed team fits into a *different*,
          // currently inactive tab's cache (e.g. following from All while Following is cached
          // stale). Invalidate so any inactive tab variant refetches for real next time it's
          // viewed, instead of silently serving stale data until a hard reload.
          queryClient.invalidateQueries({ queryKey: [TeamsQueryKeys.GET_TEAMS_LIST] });
        },
      },
    );
  };

  return { toggleFollow, isPending };
}
