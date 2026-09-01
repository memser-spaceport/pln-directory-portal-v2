import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

interface MutationParams {
  uid: string;
  payload: any;
}

async function mutation({ uid, payload }: MutationParams) {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status.message || 'Failed to update members params');
  }

  return await response.json();
}

/**
 * Patch one cached member record, whatever shape it is stored in.
 *
 * **Two shapes, because there are two ways this app caches a member.**
 * `useMember` stores `{ memberInfo }`; the surfaces that call `getMember`
 * directly — the member page, the job and investor drawers, the apply-flow
 * controller — store the raw response `{ data: { formattedData } }` and narrow
 * it with `select`, so the cache holds the *pre-select* shape and that is what
 * has to be patched.
 *
 * **Anything else is returned untouched, deliberately.** Now that the write
 * matches by prefix it is handed cache entries nobody has audited (Demo Day's
 * modal, the IRL gathering modal). A guess at an unrecognised shape would
 * corrupt a cache to save a round trip; a no-op just means that surface waits
 * for the refetch, which is what it does today anyway.
 */
export function patchCachedMember(old: unknown, payload: Record<string, unknown>): unknown {
  if (!old || typeof old !== 'object') return old;

  if ('memberInfo' in old && old.memberInfo && typeof old.memberInfo === 'object') {
    return { ...old, memberInfo: { ...old.memberInfo, ...payload } };
  }

  if ('data' in old && old.data && typeof old.data === 'object' && 'formattedData' in old.data) {
    const data = old.data as { formattedData?: unknown };
    if (data.formattedData && typeof data.formattedData === 'object') {
      return { ...old, data: { ...data, formattedData: { ...data.formattedData, ...payload } } };
    }
  }

  return old;
}

/**
 * Every cached entry for one member.
 *
 * **A filter, matching by PREFIX, and that is the whole fix.**
 * `setQueryData`/`getQueryData` take an **exact** key. This used to call both
 * with `[GET_MEMBER, uid]`, which is only `useMember`'s key — so every surface
 * keyed on `[GET_MEMBER, uid, isLoggedIn, viewerUid]` (the member page, the job
 * drawer, the investor drawer, the apply-flow controller) got no optimistic
 * update at all. The dot didn't move until the PATCH *and* the invalidated
 * refetch had both come back: two sequential round trips to move a radio
 * button.
 *
 * `getQueriesData`/`setQueriesData` take this filter instead, which matches by
 * prefix. `uid` is still in the key, so it can only ever reach entries for the
 * member being edited. Same trap, same answer, as the note in
 * `useApplyCvImport`.
 */
const memberCacheFilter = (uid: string) => ({ queryKey: [MembersQueryKeys.GET_MEMBER, uid] });

/**
 * Show the change now, and hand back what to put back if the server disagrees.
 *
 * Exported with `patchCachedMember` so the contract can be tested as one piece.
 * Testing the shape rules alone would leave the half that actually broke — the
 * exact-vs-prefix key — unguarded, which is how it shipped.
 */
export function applyOptimisticMemberPatch(
  queryClient: QueryClient,
  uid: string,
  payload: Record<string, unknown>,
): Array<[QueryKey, unknown]> {
  const filter = memberCacheFilter(uid);

  /* Every matching entry, not one — the same member is commonly cached under
     two keys at once (the page, with a drawer open over it), and rolling back
     only one would leave them disagreeing about the same record. */
  const prev = queryClient.getQueriesData(filter);

  queryClient.setQueriesData(filter, (old) => patchCachedMember(old, payload));

  return prev as Array<[QueryKey, unknown]>;
}

/**
 * Put back exactly what was there.
 *
 * Key-by-key from the snapshot rather than re-deriving anything: the snapshot
 * already records which keys existed and what was in them, including the
 * entries `patchCachedMember` declined to touch.
 */
export function rollbackCachedMembers(queryClient: QueryClient, prev: Array<[QueryKey, unknown]> | undefined): void {
  prev?.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);
  });
}

export function useUpdateMemberParams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mutation,
    onMutate: async ({ uid, payload }: MutationParams) => {
      await queryClient.cancelQueries(memberCacheFilter(uid));

      return { prev: applyOptimisticMemberPatch(queryClient, uid, payload) };
    },
    onError: (error, variables, context) => {
      rollbackCachedMembers(queryClient, context?.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.VALIDATE_OFFICE_HOURS],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBERS_LIST],
      });

      queryClient.invalidateQueries({
        queryKey: [MembersQueryKeys.GET_MEMBER_REPOSITORIES],
      });
    },
  });
}
