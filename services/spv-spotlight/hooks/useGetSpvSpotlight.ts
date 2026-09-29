import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { SPV_MOCK_ENABLED, SpvSpotlightQueryKeys } from '@/services/spv-spotlight/constants';
import { readSpvMockOverrides } from '@/services/spv-spotlight/spv-spotlight.mock';
import { getSpvSpotlight } from '@/services/spv-spotlight/spv-spotlight.service';
import type { SpvSpotlight } from '@/services/spv-spotlight/types';

export function useGetSpvSpotlight(slug: string, initialData?: SpvSpotlight | null) {
  const searchParams = useSearchParams();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const authenticated = !!currentUser?.uid;
  // The state switch is dev-only: ignored entirely unless the mock is on.
  const overrides = SPV_MOCK_ENABLED ? readSpvMockOverrides(searchParams) : {};
  const hasOverrides = !!overrides.status || !!overrides.access;

  return useQuery({
    queryKey: [SpvSpotlightQueryKeys.GET_SPOTLIGHT, slug, currentUser?.uid ?? null, overrides.status, overrides.access],
    queryFn: () => getSpvSpotlight(slug, authenticated, overrides),
    // Wait for the auth store: an authenticated read fired before it hydrates
    // would go out anonymous and paint the wrong viewer state.
    enabled: !!slug && isHydrated,
    // The server's read is anonymous, so it only seeds the anonymous key.
    ...(!authenticated && !hasOverrides && initialData ? { initialData } : {}),
  });
}
