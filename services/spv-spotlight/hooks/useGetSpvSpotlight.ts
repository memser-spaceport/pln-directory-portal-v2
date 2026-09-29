import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { SPV_MOCK_ENABLED, SpvSpotlightQueryKeys } from '@/services/spv-spotlight/constants';
import { readSpvMockOverrides } from '@/services/spv-spotlight/spv-spotlight.mock';
import { getSpvSpotlight } from '@/services/spv-spotlight/spv-spotlight.service';

/**
 * The viewer's own read of the spotlight. Deliberately takes no server data:
 * QueryProvider's client is one per Node process, so `initialData` here would
 * write the first anonymous read into a cache every later SSR request reuses,
 * and an admin's edits would never reach server-rendered pages. The page
 * passes its server read to the view as a prop instead.
 */
export function useGetSpvSpotlight(slug: string) {
  const searchParams = useSearchParams();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const authenticated = !!currentUser?.uid;
  // The state switch is dev-only: ignored entirely unless the mock is on.
  const overrides = SPV_MOCK_ENABLED ? readSpvMockOverrides(searchParams) : {};

  return useQuery({
    queryKey: [SpvSpotlightQueryKeys.GET_SPOTLIGHT, slug, currentUser?.uid ?? null, overrides.status, overrides.access],
    queryFn: () => getSpvSpotlight(slug, authenticated, overrides),
    // Wait for the auth store: an authenticated read fired before it hydrates
    // would go out anonymous and paint the wrong viewer state.
    enabled: !!slug && isHydrated,
  });
}
