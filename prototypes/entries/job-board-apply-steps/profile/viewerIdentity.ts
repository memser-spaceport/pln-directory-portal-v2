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

/**
 * The two answers the sign-up form was filled in with.
 *
 * They live here for the same reason the address does: the filled sign-up
 * form, the `signed-up-modal` viewer's pre-filled account step and the
 * profile behind it all have to describe one person. Typed separately they
 * would be one careless edit away from a visitor whose role changes as they
 * move between two steps of the same flow.
 */
export const VIEWER_ROLE = 'Senior Protocol Engineer';
export const VIEWER_LINKEDIN = 'polina-bublii';
