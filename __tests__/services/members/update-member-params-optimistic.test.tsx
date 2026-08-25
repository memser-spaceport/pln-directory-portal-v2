import { QueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { applyOptimisticMemberPatch, rollbackCachedMembers } from '@/services/members/hooks/useUpdateMemberParams';

/**
 * The optimistic write, against the cache shapes and keys this app really uses.
 *
 * This exists because the hook already *had* an optimistic update and it did
 * nothing for most of its callers. Two independent misses, and neither shows up
 * in a component test — the UI just looks slow:
 *
 *  - `setQueryData` takes an **exact** key. The write used `[GET_MEMBER, uid]`,
 *    which is only `useMember`'s key; the member page, the job drawer, the
 *    investor drawer and the apply-flow controller all key on
 *    `[GET_MEMBER, uid, isLoggedIn, viewerUid]` and were never touched.
 *  - The updater only knew `{ memberInfo }`. Those same surfaces cache the raw
 *    response `{ data: { formattedData } }` and narrow it with `select`, so a
 *    key hit still would not have changed anything.
 *
 * So these tests are about keys and shapes, exercised through a real
 * `QueryClient` rather than a mocked one — a mock would happily accept the
 * broken call and prove nothing.
 */

const UID = 'member-1';
const PAYLOAD = { jobSearchStatus: 'actively-looking' };

/* The hook's own write and rollback, imported rather than restated. A local
   copy would let this suite stay green while the hook is broken — and both
   halves of the contract have to be the real ones, because the half that
   actually shipped broken was the key matching, not the shape rules. */
const applyOptimistic = applyOptimisticMemberPatch;

describe('the optimistic member-params write', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  /** `useMember.ts:31` — the one caller the original write actually fitted. */
  it('patches the two-part key and {memberInfo} shape', () => {
    const key = [MembersQueryKeys.GET_MEMBER, UID];
    client.setQueryData(key, { memberInfo: { name: 'Polina', jobSearchStatus: null } });

    applyOptimistic(client, UID, PAYLOAD);

    expect(client.getQueryData(key)).toEqual({
      memberInfo: { name: 'Polina', jobSearchStatus: 'actively-looking' },
    });
  });

  /**
   * The bug. `JobProfileDrawer.tsx:94` and friends key on four parts and cache
   * the pre-`select` response, so both the key and the shape have to be handled
   * or the radio sits still until a refetch lands.
   */
  it('patches the four-part key and {data:{formattedData}} shape', () => {
    const key = [MembersQueryKeys.GET_MEMBER, UID, true, 'viewer-1'];
    client.setQueryData(key, { data: { formattedData: { name: 'Polina', jobSearchStatus: null } } });

    applyOptimistic(client, UID, PAYLOAD);

    expect(client.getQueryData(key)).toEqual({
      data: { formattedData: { name: 'Polina', jobSearchStatus: 'actively-looking' } },
    });
  });

  /**
   * The same member is commonly cached under both keys at once — the member
   * page with a drawer open over it. One write, or a rollback that restores only
   * one, would leave the two disagreeing about the same record.
   */
  it('patches every entry for that member, not just the first', () => {
    const short = [MembersQueryKeys.GET_MEMBER, UID];
    const long = [MembersQueryKeys.GET_MEMBER, UID, true, 'viewer-1'];
    client.setQueryData(short, { memberInfo: { jobSearchStatus: null } });
    client.setQueryData(long, { data: { formattedData: { jobSearchStatus: null } } });

    applyOptimistic(client, UID, PAYLOAD);

    expect(client.getQueryData(short)).toEqual({ memberInfo: { jobSearchStatus: 'actively-looking' } });
    expect(client.getQueryData(long)).toEqual({
      data: { formattedData: { jobSearchStatus: 'actively-looking' } },
    });
  });

  /** Prefix matching must not reach past the member being edited. */
  it('leaves other members alone', () => {
    const other = [MembersQueryKeys.GET_MEMBER, 'member-2', true, 'viewer-1'];
    client.setQueryData(other, { data: { formattedData: { jobSearchStatus: null } } });

    applyOptimistic(client, UID, PAYLOAD);

    expect(client.getQueryData(other)).toEqual({ data: { formattedData: { jobSearchStatus: null } } });
  });

  /**
   * Matching by prefix means being handed cache entries nobody audited — the
   * Demo Day and IRL modals key on `[GET_MEMBER, uid, !!userInfo, uid]` and
   * store whatever their own fetchers return. A guess at an unrecognised shape
   * would corrupt a cache to save a round trip; a no-op just means that surface
   * waits for the refetch, which is what it does today.
   */
  it.each([
    ['an unrecognised object', { somethingElse: { jobSearchStatus: null } }],
    ['a bare array', [{ jobSearchStatus: null }]],
    ['a primitive', 'not-an-object'],
    ['null', null],
  ])('leaves %s untouched rather than guessing', (_label, cached) => {
    const key = [MembersQueryKeys.GET_MEMBER, UID, false, undefined];
    client.setQueryData(key, cached);

    applyOptimistic(client, UID, PAYLOAD);

    expect(client.getQueryData(key)).toEqual(cached);
  });

  /**
   * Rollback restores from the snapshot key-by-key, so it has to survive the
   * mixed case: entries that were patched and entries the updater declined to
   * touch, side by side.
   */
  it('restores every snapshotted entry on failure', () => {
    const long = [MembersQueryKeys.GET_MEMBER, UID, true, 'viewer-1'];
    const foreign = [MembersQueryKeys.GET_MEMBER, UID, 'odd'];
    const originalLong = { data: { formattedData: { jobSearchStatus: 'not-looking' } } };
    const originalForeign = { somethingElse: true };
    client.setQueryData(long, originalLong);
    client.setQueryData(foreign, originalForeign);

    /* The snapshot the write itself hands back — the same value `onMutate`
       stores as context and `onError` is given. */
    const prev = applyOptimistic(client, UID, PAYLOAD);
    expect(client.getQueryData(long)).not.toEqual(originalLong);

    rollbackCachedMembers(client, prev);

    expect(client.getQueryData(long)).toEqual(originalLong);
    expect(client.getQueryData(foreign)).toEqual(originalForeign);
  });
});
