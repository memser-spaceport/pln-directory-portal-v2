import { useQuery } from '@tanstack/react-query';
import { useCurrentUserStore } from '@/services/auth/store';
import { SpvSpotlightQueryKeys } from '@/services/spv-spotlight/constants';
import { getSpvSpotlight } from '@/services/spv-spotlight/spv-spotlight.service';

/**
 * The viewer's own read of the spotlight. Deliberately takes no server data:
 * QueryProvider's client is one per Node process, so `initialData` here would
 * write the first anonymous read into a cache every later SSR request reuses,
 * and an admin's edits would never reach server-rendered pages. The page
 * passes its server read to the view as a prop instead.
 */
export function useGetSpvSpotlight(slug: string) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const authenticated = !!currentUser?.uid;

  return useQuery({
    // Keyed by viewer: a signed-in read carries viewerAccess and the DocSend
    // link, and must never be served to anyone else.
    queryKey: [SpvSpotlightQueryKeys.GET_SPOTLIGHT, slug, currentUser?.uid ?? null],
    queryFn: () => getSpvSpotlight(slug, authenticated),
    // Wait for the auth store: an authenticated read fired before it hydrates
    // would go out anonymous and paint the wrong viewer state.
    enabled: !!slug && isHydrated,
  });
}
