import { useQuery } from '@tanstack/react-query';

import { JobsQueryKey } from '@/services/jobs/constants';
import { fetchJobByUid } from '@/services/jobs/jobs.service';
import type { IJobRole } from '@/types/jobs.types';

/**
 * A role's description: its own `descriptionHtml`, or, for a role the board's server page sent without one
 * (`descriptionOmitted`, LAB-3254), the body fetched by uid. The drawer keeps the role it was opened with, so a role
 * from that page (a `?job=` link, or a click before the client's own fetch lands) never gets a body any other way.
 */
export function useRoleDescriptionHtml(role: IJobRole | null | undefined): { html: string | null; isLoading: boolean } {
  const uid = role?.uid;
  const omitted = Boolean(role?.descriptionOmitted && uid);

  const query = useQuery({
    queryKey: [JobsQueryKey.RoleDescription, uid],
    queryFn: async () => {
      const group = await fetchJobByUid(uid as string);
      return group?.roles.find((item) => item.uid === uid)?.descriptionHtml ?? null;
    },
    enabled: omitted,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (!omitted) return { html: role?.descriptionHtml ?? null, isLoading: false };
  return { html: typeof query.data === 'string' ? query.data : null, isLoading: query.isPending };
}
