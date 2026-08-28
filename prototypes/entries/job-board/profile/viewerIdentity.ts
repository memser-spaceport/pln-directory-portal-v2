/**
 * Who the signed-in viewer is, for the header card only.
 *
 * The name is the one thing the profile card shows that the flow never asks for —
 * in production it comes from the account, not from this form — so it lives here
 * as a fixed mock rather than on `MemberProfile`, which is the record the drawer
 * actually edits. Same person as the `profile-settings` prototype, so the two
 * prototypes are demonstrably one member.
 *
 * The avatar used to live here too. The drawer no longer renders one: see the
 * note on the header card in `JobProfileDrawer.tsx`.
 */
export const VIEWER_NAME = 'Polina Bublii';
