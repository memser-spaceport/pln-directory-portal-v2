/**
 * Who the signed-in viewer is, for the header card and for the two account facts
 * the CV importer must never offer to fill in again.
 *
 * The name and the email are the things the profile card shows that the flow
 * never asks for — in production both come from the account, not from this form —
 * so they live here as fixed mocks rather than on `MemberProfile`, which is the
 * record the drawer actually edits. Same person as the `profile-settings`
 * prototype, so the two prototypes are demonstrably one member.
 *
 * The avatar used to live here too. The drawer no longer renders one: see the
 * note on the header card in `JobProfilePane.tsx`.
 */
export const VIEWER_NAME = 'Polina Bublii';

/**
 * The address the account was created with.
 *
 * Its one job today is to be *non-empty*: `ExperienceImportReview` asks for a
 * contact detail only where the profile is blank, so a signed-in board is never
 * offered back the email it already has. `JobSignUpModal`'s filled-canvas form
 * reads it too, so the sign-up screen, the profile and the application email all
 * name one applicant rather than three near-identical addresses that drift.
 */
export const VIEWER_EMAIL = 'polina@lattice.computer';
