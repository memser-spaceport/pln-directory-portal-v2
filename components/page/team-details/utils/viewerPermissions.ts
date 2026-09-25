import type { IUserInfo } from '@/types/shared.types';

/**
 * This app carries a viewer's permissions in two places that disagree.
 *
 * The `userInfo` COOKIE is what a server component reads and hands down. The
 * `useCurrentUserStore` is hydrated from the API and is the one every other
 * privileged control on a team profile asks — Focus Areas' Edit, for instance.
 *
 * They diverge both ways, and today the cookie is the weaker of the two in a way
 * it cannot recover from: `UserInfoChecker` repairs the cookie from
 * `GET /v1/members/{uid}`, and that response carries no `rbac` at all — so a
 * cookie that never had permissions can never gain them, and a directory admin
 * is invisible to every gate that reads it alone.
 *
 * Union rather than "prefer one": a lead's `leadingTeams` can be fresh in the
 * cookie and absent from a store that has not hydrated yet, and the permissions
 * are fresh in the store and absent from the cookie. Either source saying yes is
 * a yes; this is an affordance, and the endpoints enforce the real rule.
 */
export function unionViewerInfo(
  cookie: IUserInfo | null | undefined,
  store: IUserInfo | null | undefined,
): IUserInfo | null {
  if (!cookie) return store ?? null;
  if (!store) return cookie;

  return {
    ...cookie,
    ...store,
    leadingTeams: [...new Set([...(cookie.leadingTeams ?? []), ...(store.leadingTeams ?? [])])],
    /* Whichever actually carries permissions. An `rbac` object with no
       `effectivePermissions` is the uninformed shape, not an empty answer. */
    rbac: store.rbac?.effectivePermissions ? store.rbac : (cookie.rbac ?? store.rbac),
  } as IUserInfo;
}

/**
 * Whether this viewer record can speak to permissions at all.
 *
 * A cookie with no `effectivePermissions` is not saying "no privileges" — it is
 * saying nothing, because the sync that would have filled it reads an endpoint
 * that omits them. A gate that treats silence as a refusal locks out exactly the
 * people it was written to admit.
 */
export const knowsPermissions = (viewer: IUserInfo | null | undefined): boolean =>
  Array.isArray(viewer?.rbac?.effectivePermissions);
