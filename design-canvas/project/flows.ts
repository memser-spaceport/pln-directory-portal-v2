/**
 * design-canvas ADAPTER — the declaration. THE ONLY PLACE SCREENS ARE NAMED.
 *
 * This canvas covers the job board prototype at `/prototypes/job-board`: every entry state the apply flow
 * branches into, and the beats between pressing Apply and the application landing with a hiring team.
 *
 * HOW THE STATES ARE REACHED. Two mechanisms, and the split is deliberate.
 *
 *   The board already understood `?viewer=`, `?profile=1`, `?email=1` and the whole filter rail before this
 *   canvas existed — that scaffolding was built for the Preview-as switch a reviewer uses by hand. Screens
 *   that one of those can reach are declared with it, because a review-only flag duplicating a real one is a
 *   second thing to keep in sync.
 *
 *   Everything else is an overlay opened by a press, and parent-held: the sign-up modal, the apply modal,
 *   and the beats inside them. Those carry `?canvas=<state>` IN THE ROUTE, which
 *   `prototypes/entries/job-board/canvasStates.ts` reads. That file is the whole of the added scaffolding.
 *
 *   NOT the `state` field, deliberately. Declaring `state` makes the capture block until the document
 *   carries `data-canvas-pinned`, which only `project/canvas-state-pin.tsx` sets — and this project does not
 *   mount it, because the board already seeds itself from its own query. With `state` declared and no pin,
 *   every one of these frames waited 45 seconds, photographed a hidden body and reported all its claims
 *   missing. The route carries the query instead, which is what `route` is for.
 *
 * WHAT THIS CANVAS DOES NOT COVER, named here rather than left silent:
 *
 *   MOBILE. `viewport` is declared once per canvas, so the mobile header, the Filters sheet and the bottom
 *   bar cannot share this one. They want a second canvas at 390x844. The mobile Filters sheet also has no
 *   URL of its own yet, so that canvas starts with scaffolding work.
 *
 *   THE REFER FLOW. `JobReferRoleRow` and its modal are on the board and are not declared. Referring is a
 *   different job from applying, and mixing the two would make the flows read as one journey.
 *
 *   THE PROFILE DRAWER'S OTHER CARDS. The drawer is declared at two states, empty and waiting, plus the
 *   four frames of the Experience card's importer. The remaining cards — skills, bio, contributions,
 *   repositories — each have an empty and a filled design and are not covered.
 *
 *   THE IMPORTER IN FULL. This canvas shows the document only where it stands between Apply and an
 *   application. `cv-upload` is the canvas for the feature itself, and it covers all three surfaces.
 *
 *   TOASTS. Three of the flows end in one, and a toast dismisses itself, so a frame of the board behind it
 *   is what the capture settles on. The words are in `JobBoardPrototype`.
 */

import type { CanvasDeclaration, CanvasRegistry } from '../core/types';

/** The board's own route. Every screen here is this page in a different state. */
const BOARD = '/prototypes/job-board';

/**
 * The role every pinned overlay names — Filecoin Foundation's first opening, which is what
 * `SAMPLE_ROLE_GROUP` resolves to in the prototype. One role across the sign-up modal, the apply modal and
 * the email, so the frames read as one application rather than three unrelated ones.
 */
const ROLE = 'Head of Ecosystem Growth';

export const CANVAS: CanvasDeclaration = {
  title: 'Job Board Apply Flow',
  note: 'Every state of the job board, from browsing without an account to an application landing with a hiring team.',
  viewport: { w: 1440, h: 900 },
  frameScale: 0.8,
  /**
   * THE SECTIONS OF THE GROUPED VIEW, declared so a screen filed outside them FAILS rather than quietly
   * inventing a heading. Read this list before adding a screen, and file it under one of these. If none
   * fits, add a section here with a line saying what belongs in it.
   */
  kinds: [
    { id: 'Board entry states', whatBelongs: 'The board itself, once per person who can be looking at it' },
    { id: 'Creating an account', whatBelongs: 'The sign-up form, at each beat it can be caught in' },
    { id: 'Sending the application', whatBelongs: 'The apply modal, its letter, and the email it produces' },
    { id: 'The list, narrowed', whatBelongs: 'The board with the rail, the search or the scope cutting it' },
    { id: 'The profile drawer', whatBelongs: 'The profile step, at the states the apply flow opens it in' },
    {
      id: 'Importing a history',
      whatBelongs: 'The drop area, and everything a read document can come back with',
    },
  ],
  flows: [
    {
      id: 'no-account',
      title: 'Applying Without an Account',
      note: 'What a person with no account meets when they press Apply, and where signing up leaves them.',
      screens: [
        {
          id: 'board-logged-out',
          label: 'The Signed Out Board',
          note: 'The standing offer to sign in, above a board anyone can read.',
          route: `${BOARD}?viewer=logged-out`,
          kind: 'Board entry states',
          source: [
            'prototypes/entries/job-board/JobBoardPrototype.tsx',
            'prototypes/entries/job-board/SignInBanner.tsx',
          ],
          /* NOT the banner's headline. That line is assembled from the counts — "Browse 13 open roles across
             6 PL network teams" — and its countless version only renders when the rail has narrowed to zero.
             This bullet is what a signed-out board says and a signed-in one does not: the two doors live
             inside it now that the CTA pair is gone, so "sign up" is present here and nowhere in the
             signed-in banners, whose copy is the same sentence with the doors taken off the front. */
          expect: ['Job Board', 'and apply to hundreds of open roles with a single profile'],
          /* The banner that replaces this one once an account exists. Without it a signed-in board with the
             sign-in banner still on it would pass every positive claim here. */
          expectMissing: ['Update your profile to apply', 'Profile under review'],
        },
        {
          id: 'signup-generic',
          label: 'Sign up, No Role',
          note: 'The header door, which carries no role and asks for an account on its own terms.',
          route: `${BOARD}?canvas=signup-generic`,
          kind: 'Creating an account',
          source: ['prototypes/entries/job-board/JobSignUpModal.tsx'],
          expect: ['Sign up to apply', 'One profile applies to every open role across the Protocol Labs network.'],
          expectMissing: [`Apply for ${ROLE}`],
        },
        {
          id: 'signup-on-role',
          label: 'Sign up on a Role',
          note: 'The same form reached by pressing Apply, which names the role it will resume on.',
          route: `${BOARD}?canvas=signup-on-role`,
          kind: 'Creating an account',
          source: ['prototypes/entries/job-board/JobSignUpModal.tsx'],
          expect: [`Apply for ${ROLE}`],
          expectMissing: ['Sign up to apply'],
        },
        {
          id: 'signup-refused',
          label: 'The Refused Sign Up',
          note: "The form's own schema, run against an empty form, in the words it renders.",
          route: `${BOARD}?canvas=signup-refused`,
          kind: 'Creating an account',
          source: ['prototypes/entries/job-board/JobSignUpModal.tsx'],
          expect: ['Email is required', 'Name is required', 'Role is required'],
        },
        {
          id: 'signup-filled',
          label: 'The Filled Sign Up',
          note: 'The same form with answers in it, which is a different design from the empty one.',
          route: `${BOARD}?canvas=signup-filled`,
          kind: 'Creating an account',
          source: ['prototypes/entries/job-board/JobSignUpModal.tsx'],
          expect: [`Apply for ${ROLE}`],
          /* Proves the errors are gone. A filled form and a refused one differ by what they no longer say. */
          expectMissing: ['Email is required'],
          /* THE ANSWERS THEMSELVES CANNOT BE CLAIMED AS TEXT. The oracle reads `innerText`, and `innerText`
             never contains the value of an input — so "Polina Bublii" is on the screen, in the frame, and
             invisible to a text claim. Verified in a browser: the values are all there and the text read
             returns none of them.

             So the claim is the field's own state. `:not(:placeholder-shown)` matches an input that has
             something in it, and scoping it to `name` keeps the board's twenty other inputs out: this
             resolves once here and zero times on the empty and refused frames beside it. */
          expectSelector: 'input[name="name"]:not(:placeholder-shown)',
        },
        {
          id: 'board-pending',
          label: 'Waiting on Approval',
          note: 'The account exists and browsing is untouched, but applying waits on the PL team.',
          route: `${BOARD}?viewer=pending-approval`,
          kind: 'Board entry states',
          source: [
            'prototypes/entries/job-board/BoardBanners.tsx',
            'prototypes/entries/job-board/PendingApprovalSteps.tsx',
          ],
          expect: ['Profile under review'],
          expectMissing: ['Update your profile to apply'],
        },
        {
          id: 'drawer-pending',
          label: 'The Drawer While Waiting',
          note: 'The one move approval does not block: filling the profile in while the wait runs.',
          route: `${BOARD}?viewer=pending-approval&profile=1`,
          kind: 'The profile drawer',
          source: [
            'prototypes/entries/job-board/JobProfileDrawer.tsx',
            'prototypes/entries/job-board/PendingApprovalSteps.tsx',
          ],
          expect: ['Complete your profile', 'Await approval confirmation'],
        },
      ],
      edges: [
        { from: 'board-logged-out', to: 'signup-on-role', label: 'Presses Apply on a role' },
        { from: 'board-logged-out', to: 'signup-generic', label: 'Presses Sign up' },
        { from: 'signup-on-role', to: 'signup-refused', label: 'Presses Sign up empty' },
        { from: 'signup-refused', to: 'signup-filled', label: 'Fixes the errors' },
        { from: 'signup-on-role', to: 'signup-filled', label: 'Types their details' },
        { from: 'signup-filled', to: 'board-pending', label: 'Finishes signing up' },
        { from: 'board-pending', to: 'drawer-pending', label: 'Presses Update profile' },
      ],
    },
    {
      id: 'with-profile',
      title: 'Applying with a Profile',
      note: 'The payoff the board promises: a finished profile turns Apply into one letter and one press.',
      screens: [
        {
          id: 'board-ready',
          label: 'The Ready Profile Board',
          note: 'Signed in with a profile that clears the bar, so no banner asks for anything.',
          route: `${BOARD}?viewer=profile-ready`,
          kind: 'Board entry states',
          source: ['prototypes/entries/job-board/JobBoardPrototype.tsx'],
          expect: ['Job Board'],
          /* All three asks at once. This board is defined by what it does NOT say. */
          expectMissing: [
            'Update your profile to apply',
            'Profile under review',
            'Browse every open role across the PL network',
          ],
        },
        {
          id: 'apply-letter-empty',
          label: 'The Empty Cover Letter',
          note: 'The profile read back, and the one field left to write before anything is sent.',
          route: `${BOARD}?canvas=apply-letter-empty`,
          kind: 'Sending the application',
          source: ['prototypes/entries/job-board/JobApplyModal.tsx'],
          expect: [`Apply for ${ROLE}`, 'Cover letter (message for the team)'],
        },
        {
          id: 'apply-letter-filled',
          label: 'The Written Cover Letter',
          note: 'The letter written and Submit live, which is the last state before it goes.',
          route: `${BOARD}?canvas=apply-letter-filled`,
          kind: 'Sending the application',
          source: ['prototypes/entries/job-board/JobApplyModal.tsx'],
          expect: ['Submit'],
          /* The letter is in a textarea, so no text claim can reach it — see the note on the filled sign-up.
             An empty textarea shows its placeholder and a written one does not, which is the difference this
             frame exists to show. It also proves Submit is live: `canSend` is what a written letter buys. */
          expectSelector: 'textarea:not(:placeholder-shown)',
        },
        {
          id: 'board-applied',
          label: 'The Board After Applying',
          note: 'Rows they have gone for report the date instead of offering the press again.',
          route: `${BOARD}?viewer=applied`,
          kind: 'Board entry states',
          source: ['prototypes/entries/job-board/JobReferRoleRow.tsx'],
          expect: ['Applied 2d ago', 'Applied 9d ago'],
        },
        {
          id: 'applied-tab',
          label: 'The Applied Tab',
          note: 'The same board narrowed to what they have already gone for, grouped by team.',
          route: `${BOARD}?viewer=applied&scope=applied`,
          kind: 'The list, narrowed',
          source: ['prototypes/entries/job-board/JobBoardScopeTabs.tsx'],
          expect: ['Applied 2d ago'],
          /* Roles from every other team are gone, which is the whole of what the tab does. */
          expectMissing: ['Networking Engineer (Go)'],
        },
        {
          id: 'email-preview',
          label: 'The Email the Team Gets',
          note: 'What leaves the product when someone applies, and the one artifact a member never sees.',
          route: `${BOARD}?email=1`,
          /* Filed with the two apply frames rather than left unkinded. Leaving `kind` off does not keep a
             screen out of the grouped view — it files it under "Other", and the oracle then fails that as a
             group of one, which is the same rule that says a heading over one frame is not a group. It
             belongs here on its own merits: sending the application is what produces it. */
          kind: 'Sending the application',
          source: ['prototypes/entries/job-board/email/ApplicationEmailPreview.tsx'],
          expect: [ROLE, 'Filecoin Foundation'],
        },
      ],
      edges: [
        { from: 'board-ready', to: 'apply-letter-empty', label: 'Presses Apply on a role' },
        { from: 'apply-letter-empty', to: 'apply-letter-filled', label: 'Types their letter' },
        { from: 'apply-letter-filled', to: 'board-applied', label: 'Presses Submit' },
        { from: 'apply-letter-filled', to: 'email-preview', label: 'When the note is sent' },
        { from: 'board-applied', to: 'applied-tab', label: 'Opens the Applied tab' },
      ],
    },
    {
      /* The gate and the import are ONE journey, not two. They were separate flows until a reviewer asked
         why the import began on a blue editing card: the offer is not a screen of its own, it stands in the
         drawer this flow already opens. Splitting them meant the import flow had to invent a first frame,
         and the frame it invented was the wrong route in.

         THE IMPORTER'S OWN FLOW IS A SECOND CANVAS. `cv-upload` covers the document end to end, across all
         three surfaces that mount it. What stays here is the part that belongs to applying: an empty
         profile is what stands between pressing Apply and sending anything. */
      id: 'empty-profile',
      title: 'Filling an Empty Profile',
      note: 'Signed in with nothing filled in, where the profile can be typed or read from a document.',
      screens: [
        {
          id: 'board-incomplete',
          label: 'The Empty Profile Board',
          note: 'The account exists, so the ask moves from signing in to finishing the profile.',
          route: `${BOARD}?viewer=profile-incomplete`,
          kind: 'Board entry states',
          source: ['prototypes/entries/job-board/BoardBanners.tsx'],
          expect: ['Update your profile to apply'],
          expectMissing: ['Profile under review', 'Browse every open role across the PL network'],
        },
        {
          id: 'drawer-empty',
          label: 'The Empty Profile Drawer',
          /* THIS FRAME IS ALSO THE IMPORT'S FIRST. The offer stands in a card above the two required ones,
             its drop area already open, so it is already in this picture and a frame of the drop area on
             its own would be the same screen twice. That frame used to exist, as `import-resume`, from
             back when the offer was a pill you had to press. A second one, `import-linkedin`, went with the
             door it photographed — see `ExperienceImportPanel`. */
          note: 'Every card at its empty design, with the CV offer standing above the two required ones.',
          route: `${BOARD}?viewer=profile-incomplete&profile=1`,
          kind: 'The profile drawer',
          source: [
            'prototypes/entries/job-board/JobProfileDrawer.tsx',
            'prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx',
          ],
          expect: ['Start with your CV', 'Drag & drop your CV'],
          /* The stepper belongs to the waiting state next door, and these two drawers are otherwise close
             enough to photograph alike. */
          expectMissing: ['Await approval confirmation'],
        },
        {
          id: 'import-reading',
          label: 'Reading the Document',
          note: 'The wait, naming the file, because a spinner alone does not say what it holds.',
          route: `${BOARD}?canvas=import-reading`,
          kind: 'Importing a history',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx'],
          expect: ['Reading polina-bublii-cv.pdf'],
        },
        {
          id: 'import-nothing-found',
          label: 'Nothing Found in It',
          note: 'The dead end, which has to offer the way out it took away.',
          route: `${BOARD}?canvas=import-nothing-found`,
          kind: 'Importing a history',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx'],
          expect: ['find any roles in that file'],
        },
        {
          id: 'import-review',
          label: 'The Parse, Reviewed',
          note: 'What the document said, offered rather than kept, with Cancel and Save under it.',
          route: `${BOARD}?canvas=import-review`,
          kind: 'Importing a history',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx'],
          expect: ['Senior Protocol Engineer'],
          /* The clean parse is defined by the prompt it does NOT carry. */
          expectMissing: ['No dates in the document'],
        },
        {
          id: 'import-review-missing-date',
          label: 'The Missing Start Date',
          note: 'The common failure, asked for inline rather than discovered when Save refuses.',
          route: `${BOARD}?canvas=import-review-missing-date`,
          kind: 'Importing a history',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx'],
          expect: ['No dates in the document'],
        },
      ],
      edges: [
        { from: 'board-incomplete', to: 'drawer-empty', label: 'Presses Apply on a role' },
        { from: 'drawer-empty', to: 'import-reading', label: 'Adds a document' },
        { from: 'import-reading', to: 'import-review', label: 'When roles are found' },
        { from: 'import-reading', to: 'import-review-missing-date', label: 'When a date is absent' },
        { from: 'import-reading', to: 'import-nothing-found', label: 'When nothing is found' },
      ],
    },
    {
      id: 'narrowing',
      title: 'Narrowing the Board',
      note: 'The rail and the search box, and the dead end a person can narrow themselves into.',
      screens: [
        {
          id: 'board-search',
          label: 'A Search for a Team',
          note: "The search box matches a team name and keeps that team's roles whole.",
          route: `${BOARD}?viewer=logged-out&q=libp2p`,
          kind: 'The list, narrowed',
          source: ['prototypes/entries/job-board/JobBoardPrototype.tsx'],
          expect: ['Networking Engineer (Go)'],
          expectMissing: ['Head of Ecosystem Growth'],
        },
        {
          id: 'board-filtered',
          label: 'The Board Narrowed',
          note: 'One axis of the rail in use, with the count in the title reading what survived.',
          route: `${BOARD}?viewer=logged-out&roleCategory=Engineering`,
          kind: 'The list, narrowed',
          source: ['prototypes/entries/job-board/JobBoardFilterView.tsx'],
          expect: ['Job Board'],
          expectMissing: ['Grants Program Operations Lead'],
        },
        {
          id: 'board-no-results',
          label: 'No Roles Match',
          note: 'Narrowed to nothing, which is a dead end reached by choosing rather than by lacking.',
          route: `${BOARD}?viewer=logged-out&roleCategory=Design&seniority=Principal%2B+(L6-L7)`,
          kind: 'The list, narrowed',
          source: ['prototypes/entries/job-board/JobBoardPrototype.tsx'],
          expect: ['No roles match your filters. Try clearing some.'],
        },
      ],
      edges: [
        { from: 'board-search', to: 'board-filtered', label: 'Picks a role filter' },
        { from: 'board-filtered', to: 'board-no-results', label: 'Picks more filters' },
      ],
    },
  ],
};

/** The new member profile, which is where a blank profile meets the document first. */
const PROFILE = '/prototypes/onboarding';
/** The settings page, and the only surface whose Experience section opens on a list. */
const SETTINGS = '/prototypes/profile-settings';

/**
 * THE CV UPLOAD — the feature's own canvas, across every surface that mounts it.
 *
 * `ExperienceImportPanel` and `ExperienceImportReview` live in `profile-shared/` and are mounted by three
 * hosts: the new member profile, the job board's apply drawer, and the settings page. The job-board canvas
 * above shows the document only where it stands between Apply and an application. This one is about the
 * document itself: who is offered it, what the wait looks like, everything a read file can come back with,
 * and what the profile holds afterwards.
 *
 * WHY ALMOST EVERY FRAME IS THE NEW MEMBER PROFILE. One person, one document, one profile filling up: the
 * fixtures in `parseMocks` are Polina Bublii's CV and `/prototypes/onboarding` is Polina Bublii's profile,
 * so the whole journey can be photographed as one story rather than as three unrelated ones. The other two
 * surfaces appear where they say something this one cannot — see the grouped set at the bottom.
 *
 * HOW THE STATES ARE REACHED. `?canvas=<state>`, read by `prototypes/entries/onboarding/canvasStates.ts`
 * and `prototypes/entries/profile-settings/canvasStates.ts`. Neither page read a query before this canvas
 * existed, so both files are the whole of the added scaffolding, and both name the canvas in their delete
 * note. The drawer frame needs none: `?viewer=` and `?profile=1` are the board's own.
 *
 * NOT the `state` field, for the same reason the job board does not use it — see the note at the top of
 * this file. The route carries the query instead.
 *
 * WHAT IS NOT COVERED, named rather than left silent:
 *
 *   THE FILE DIALOG. "Update from CV" opens the operating system's own picker, which no capture can
 *   photograph, and the wait that follows it is the frame this canvas already holds one of.
 *
 *   A REJECTED FILE. `ResumeDropzone` refuses anything over 5MB or outside PDF, DOC and DOCX, in
 *   production's own words, and that error strip has no URL. It is the next frame worth adding.
 *
 *   MOBILE. `viewport` is declared once per canvas, so a phone canvas is a second slug.
 */
export const CV_UPLOAD: CanvasDeclaration = {
  title: 'The CV Upload',
  note: 'One document fills a profile: the offer, the wait, what came back, and the merge. The same importer on three surfaces.',
  viewport: { w: 1440, h: 900 },
  frameScale: 0.8,
  kinds: [
    {
      id: 'Where the offer lives',
      whatBelongs: 'The surface making the offer, once per host that can make it',
    },
    { id: 'Handing the document over', whatBelongs: 'The drop area, and the wait while a file is read' },
    {
      id: 'What the document said',
      whatBelongs: 'Every result a read file can produce, including nothing at all',
    },
    { id: 'After the merge', whatBelongs: 'The profile once the person has agreed to what the document said' },
  ],
  flows: [
    {
      /* ONE FLOW, NOT TWO. The first import and the second are the same journey: the profile the first one
         fills is the profile the second one lands on, so `profile-filled` is both the end of one and the
         start of the other. Declaring them separately meant declaring that frame twice, which is one screen
         photographed under two names. */
      id: 'one-cv-then-another',
      title: 'One CV, Then Another',
      note: 'A profile with nothing in it, filled from one document, and updated a year later from a newer one.',
      screens: [
        {
          id: 'blank-profile',
          label: 'The Blank Profile',
          note: 'Nothing filled in, so the offer stands at the top with its drop area already open.',
          route: PROFILE,
          kind: 'Where the offer lives',
          source: [
            'prototypes/entries/onboarding/OnboardingPrototype.tsx',
            'prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx',
          ],
          expect: ['Start with your CV', 'Drag & drop your CV', 'A LinkedIn PDF export works too'],
          /* ONE HOST AT A TIME, proved by what this page does NOT say. "Upload your CV" is the Experience
             section's own pill and "Update from CV" is its header button, and neither may appear while the
             card at the top is making the offer. */
          expectMissing: ['Upload your CV', 'Update from CV'],
        },
        {
          id: 'reading',
          label: 'Reading the Document',
          note: 'The wait, naming the file, because a spinner alone does not say what it holds.',
          route: `${PROFILE}?canvas=reading`,
          kind: 'Handing the document over',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx'],
          expect: ['Reading polina-bublii-cv.pdf'],
        },
        {
          id: 'review',
          label: 'What the CV Said',
          note: 'Three roles, the role and location read off the top, and the skills the document carried.',
          route: `${PROFILE}?canvas=review`,
          kind: 'What the document said',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx'],
          expect: ['Review your experience', 'Experience (3 found)', 'Current role', 'Senior Protocol Engineer'],
          /* The clean parse is defined by the two prompts it does NOT carry. */
          expectMissing: ['No dates in the document', 'Already on your profile'],
        },
        {
          id: 'review-missing-date',
          label: 'The Missing Start Date',
          note: 'The commonest parse failure, asked for inline rather than found when Save refuses.',
          route: `${PROFILE}?canvas=review-missing-date`,
          kind: 'What the document said',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx'],
          expect: ['No dates in the document', 'Start Date'],
        },
        {
          id: 'nothing-found',
          label: 'Nothing Found in It',
          note: 'The dead end, which has to offer the way out it took away.',
          route: `${PROFILE}?canvas=nothing-found`,
          kind: 'What the document said',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx'],
          expect: ['find any roles in that file', 'Try another file', 'Add manually'],
        },
        {
          id: 'profile-filled',
          label: 'The Profile It Filled',
          note: 'One drop answered the header card, the skills row and the whole work history.',
          route: `${PROFILE}?canvas=filled`,
          kind: 'After the merge',
          source: ['prototypes/entries/onboarding/OnboardingPrototype.tsx'],
          expect: ['Senior Protocol Engineer', 'Berlin, Germany', 'Experience (3)', 'Update from CV'],
          /* The offer has moved: the card at the top is gone and the header button has appeared. */
          expectMissing: ['Start with your CV', '+ Your Role'],
        },
        {
          id: 'update-review',
          label: 'The Second Import',
          note: 'Four roles read, and the three already on the profile arrive unticked.',
          route: `${PROFILE}?canvas=update-review`,
          kind: 'What the document said',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx'],
          expect: ['Experience (4 found)', 'Already on your profile', 'Protocol Lead'],
          /* The role and location fields are absent because the profile has both. This card only asks for
             what is still missing, which is the difference between a first import and a second. */
          expectMissing: ['Current role'],
        },
        {
          id: 'update-merged',
          label: 'The One New Role',
          note: 'Save added the role the newer document brought and left the three that were there.',
          route: `${PROFILE}?canvas=update-merged`,
          kind: 'After the merge',
          source: ['prototypes/entries/onboarding/OnboardingPrototype.tsx'],
          expect: ['Experience (4)', 'Protocol Lead', 'Filecoin Foundation'],
        },
      ],
      edges: [
        { from: 'blank-profile', to: 'reading', label: 'Adds a document' },
        { from: 'reading', to: 'review', label: 'When roles are found' },
        { from: 'reading', to: 'review-missing-date', label: 'When a date is absent', kind: 'branch' },
        { from: 'reading', to: 'nothing-found', label: 'When nothing is found', kind: 'branch' },
        { from: 'review', to: 'profile-filled', label: 'Presses Save' },
        /* The second pass. The file dialog between these two frames is the operating system's, so there is
           nothing to photograph, and the wait that follows it is the frame above. */
        { from: 'profile-filled', to: 'update-review', label: 'Picks a newer CV' },
        { from: 'update-review', to: 'update-merged', label: 'Presses Save' },
      ],
    },
    {
      /* A SET TO COMPARE, NOT A JOURNEY. These two frames are the same importer on the other two surfaces,
         and an arrow between them would claim a person moves from one to the other. What they answer is
         "who is offered this, and where does it sit" — which is the grouped view's question. */
      id: 'other-surfaces',
      title: 'The Other Two Surfaces',
      note: 'The same importer where the apply drawer and the settings page mount it.',
      groupedOnly: true,
      screens: [
        {
          id: 'drawer-empty',
          label: 'The Apply Drawer',
          note: 'Pressing Apply with an empty profile opens the same offer, inside a drawer.',
          route: `${BOARD}?viewer=profile-incomplete&profile=1`,
          kind: 'Where the offer lives',
          source: ['prototypes/entries/job-board/JobProfileDrawer.tsx'],
          expect: ['Start with your CV', 'Drag & drop your CV'],
          expectMissing: ['Upload your CV'],
        },
        {
          id: 'settings-empty',
          label: 'The Settings Page',
          note: 'A filled profile with no history, where the offer is the section pill.',
          route: `${SETTINGS}?canvas=no-history`,
          kind: 'Where the offer lives',
          source: ['prototypes/entries/profile-settings/ProfileSettingsPrototype.tsx'],
          expect: ['Upload your CV', 'Share your work history and skills'],
          expectMissing: ['Start with your CV', 'Update from CV'],
        },
        {
          id: 'settings-dropzone',
          label: 'Behind the Pill',
          note: 'The door variant of the panel, with one step back to the empty row.',
          route: `${SETTINGS}?canvas=no-history-open`,
          kind: 'Handing the document over',
          source: ['prototypes/entries/profile-shared/ExperienceImport/ResumeDropzone.tsx'],
          expect: ['Drag & drop your CV', 'PDF, DOC or DOCX, up to 5MB'],
          expectMissing: ['Upload your CV'],
        },
      ],
      edges: [],
    },
  ],
};

/**
 * EVERY CANVAS THIS PROJECT HAS, keyed by the slug that addresses it: `/design-canvas/<slug>`.
 *
 * Two entries. A mobile canvas is the likely third — see the gaps named at the top of this file — and it
 * gets its own slug rather than being folded into either, because the slug namespaces the pictures and the
 * review as well as the URL.
 */
export const CANVASES: CanvasRegistry = {
  'job-board': CANVAS,
  'cv-upload': CV_UPLOAD,
};
