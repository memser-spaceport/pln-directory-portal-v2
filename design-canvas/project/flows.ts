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
 *   seven frames of the Experience card's importer. The remaining cards — skills, bio, contributions,
 *   repositories — each have an empty and a filled design and are not covered.
 *
 *   TOASTS. Three of the flows end in one, and a toast dismisses itself, so a frame of the board behind it
 *   is what the capture settles on. The words are in `JobBoardPrototype`.
 */

import type { CanvasDeclaration, CanvasRegistry } from "../core/types";

/** The board's own route. Every screen here is this page in a different state. */
const BOARD = "/prototypes/job-board";

/**
 * The role every pinned overlay names — Filecoin Foundation's first opening, which is what
 * `SAMPLE_ROLE_GROUP` resolves to in the prototype. One role across the sign-up modal, the apply modal and
 * the email, so the frames read as one application rather than three unrelated ones.
 */
const ROLE = "Head of Ecosystem Growth";

export const CANVAS: CanvasDeclaration = {
  title: "Job Board Apply Flow",
  note: "Every state of the job board, from browsing without an account to an application landing with a hiring team.",
  viewport: { w: 1440, h: 900 },
  frameScale: 0.8,
  /**
   * THE SECTIONS OF THE GROUPED VIEW, declared so a screen filed outside them FAILS rather than quietly
   * inventing a heading. Read this list before adding a screen, and file it under one of these. If none
   * fits, add a section here with a line saying what belongs in it.
   */
  kinds: [
    { id: "Board entry states", whatBelongs: "The board itself, once per person who can be looking at it" },
    { id: "Creating an account", whatBelongs: "The sign-up form, at each beat it can be caught in" },
    { id: "Sending the application", whatBelongs: "The apply modal, its letter, and the email it produces" },
    { id: "The list, narrowed", whatBelongs: "The board with the rail, the search or the scope cutting it" },
    { id: "The profile drawer", whatBelongs: "The profile step, at the states the apply flow opens it in" },
    { id: "Importing a history", whatBelongs: "The two doors, the drop areas, and what a read document comes back with" },
    {
      id: "Managing listings",
      whatBelongs: "The submit form, and listings seen by the lead who owns them",
    },
  ],
  flows: [
    {
      id: "no-account",
      title: "Applying Without an Account",
      note: "What a person with no account meets when they press Apply, and where signing up leaves them.",
      screens: [
        {
          id: "board-logged-out",
          label: "The Signed Out Board",
          note: "The standing offer to sign in, above a board anyone can read.",
          route: `${BOARD}?viewer=logged-out`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/JobBoardPrototype.tsx", "prototypes/entries/job-board/SignInBanner.tsx"],
          /* NOT the banner's headline. That line is assembled from the counts — "Browse 13 open roles across
             6 PL network teams" — and its wordless version only renders when the rail has narrowed to zero.
             This bullet is what a signed-out board says and a signed-in one does not. */
          expect: ["Job Board", "Sign in and apply to hundreds of startup teams"],
          /* The banner that replaces this one once an account exists. Without it a signed-in board with the
             sign-in banner still on it would pass every positive claim here. */
          expectMissing: ["Update your profile to apply", "Profile under review"],
        },
        {
          id: "signup-generic",
          label: "Sign up, No Role",
          note: "The header door, which carries no role and asks for an account on its own terms.",
          route: `${BOARD}?canvas=signup-generic`,
          kind: "Creating an account",
          source: ["prototypes/entries/job-board/JobSignUpModal.tsx"],
          expect: ["Sign up to apply", "One profile applies to every open role across the Protocol Labs network."],
          expectMissing: [`Apply for ${ROLE}`],
        },
        {
          id: "signup-on-role",
          label: "Sign up on a Role",
          note: "The same form reached by pressing Apply, which names the role it will resume on.",
          route: `${BOARD}?canvas=signup-on-role`,
          kind: "Creating an account",
          source: ["prototypes/entries/job-board/JobSignUpModal.tsx"],
          expect: [`Apply for ${ROLE}`],
          expectMissing: ["Sign up to apply"],
        },
        {
          id: "signup-refused",
          label: "The Refused Sign Up",
          note: "The form's own schema, run against an empty form, in the words it renders.",
          route: `${BOARD}?canvas=signup-refused`,
          kind: "Creating an account",
          source: ["prototypes/entries/job-board/JobSignUpModal.tsx"],
          expect: ["Email is required", "Name is required", "Role is required"],
        },
        {
          id: "signup-filled",
          label: "The Filled Sign Up",
          note: "The same form with answers in it, which is a different design from the empty one.",
          route: `${BOARD}?canvas=signup-filled`,
          kind: "Creating an account",
          source: ["prototypes/entries/job-board/JobSignUpModal.tsx"],
          expect: [`Apply for ${ROLE}`],
          /* Proves the errors are gone. A filled form and a refused one differ by what they no longer say. */
          expectMissing: ["Email is required"],
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
          id: "board-pending",
          label: "Waiting on Approval",
          note: "The account exists and browsing is untouched, but applying waits on the PL team.",
          route: `${BOARD}?viewer=pending-approval`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/BoardBanners.tsx", "prototypes/entries/job-board/PendingApprovalSteps.tsx"],
          expect: ["Profile under review"],
          expectMissing: ["Update your profile to apply"],
        },
        {
          id: "drawer-pending",
          label: "The Drawer While Waiting",
          note: "The one move approval does not block: filling the profile in while the wait runs.",
          route: `${BOARD}?viewer=pending-approval&profile=1`,
          kind: "The profile drawer",
          source: ["prototypes/entries/job-board/JobProfilePane.tsx", "prototypes/entries/job-board/PendingApprovalSteps.tsx"],
          expect: ["Complete your profile", "Await approval confirmation"],
        },
      ],
      edges: [
        { from: "board-logged-out", to: "signup-on-role", label: "Presses Apply on a role" },
        { from: "board-logged-out", to: "signup-generic", label: "Presses Sign up" },
        { from: "signup-on-role", to: "signup-refused", label: "Presses Sign up empty" },
        { from: "signup-refused", to: "signup-filled", label: "Fixes the errors" },
        { from: "signup-on-role", to: "signup-filled", label: "Types their details" },
        { from: "signup-filled", to: "board-pending", label: "Finishes signing up" },
        { from: "board-pending", to: "drawer-pending", label: "Presses Update profile" },
      ],
    },
    {
      id: "with-profile",
      title: "Applying with a Profile",
      note: "The payoff the board promises: a finished profile turns Apply into one letter and one press.",
      screens: [
        {
          id: "board-ready",
          label: "The Ready Profile Board",
          note: "Signed in with a profile that clears the bar, so no banner asks for anything.",
          route: `${BOARD}?viewer=profile-ready`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/JobBoardPrototype.tsx"],
          expect: ["Job Board"],
          /* All three asks at once. This board is defined by what it does NOT say. */
          expectMissing: [
            "Update your profile to apply",
            "Profile under review",
            "Browse every open role across the PL network",
          ],
        },
        {
          id: "apply-letter-empty",
          label: "The Empty Cover Letter",
          note: "The profile read back with the CV that goes with it, and the one field left to write.",
          route: `${BOARD}?canvas=apply-letter-empty`,
          kind: "Sending the application",
          source: ["prototypes/entries/job-board/JobApplicationPane.tsx"],
          expect: [`Apply for ${ROLE}`, "Cover letter (message for the team)", "polina-bublii-cv.pdf"],
        },
        /* THE KEPT CV. Three frames of the profile step for a member whose profile carries a file: the
           resting card, a replacement being read, and the removal asking. Filed under the profile drawer,
           because that is where the card lives; the import beats it reuses are already declared under
           "Importing a history" and are not repeated here. */
        {
          id: "cv-resting",
          label: "The Current CV",
          note: "The file at rest: its first page, name, size and date, with Replace and Remove in the section header.",
          route: `${BOARD}?canvas=cv-resting`,
          kind: "The profile drawer",
          source: [
            "prototypes/entries/profile-shared/StoredCv/CvFileCard.tsx",
            "prototypes/entries/profile-shared/StoredCv/CvHeaderActions.tsx",
          ],
          expect: ["Your CV", "polina-bublii-cv.pdf", "Replace", "Remove", "Preview"],
          expectMissing: ["Drag & drop your CV", "(Optional)"],
        },
        {
          id: "cv-replace-reading",
          label: "Replacing the CV",
          note: "Replace opened the file dialog, and the chosen file is read in the row the old one stood in.",
          route: `${BOARD}?canvas=cv-replace-reading`,
          kind: "The profile drawer",
          source: ["prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx"],
          expect: ["Reading polina-bublii-cv-2026.pdf", "Cancel"],
        },
        {
          id: "cv-remove-confirm",
          label: "Removing the CV",
          note: "The confirmation, stating the two things nothing else can: the fields stay, and teams you applied to lose the file.",
          route: `${BOARD}?canvas=cv-remove-confirm`,
          kind: "The profile drawer",
          source: ["prototypes/entries/profile-shared/StoredCv/RemoveCvDialog.tsx"],
          expect: ["Remove CV", "Your profile keeps what was filled in from it"],
        },
        {
          id: "apply-letter-filled",
          label: "The Written Cover Letter",
          note: "The letter written and Submit live, which is the last state before it goes.",
          route: `${BOARD}?canvas=apply-letter-filled`,
          kind: "Sending the application",
          source: ["prototypes/entries/job-board/JobApplicationPane.tsx"],
          expect: ["Submit"],
          /* The letter is in a textarea, so no text claim can reach it — see the note on the filled sign-up.
             An empty textarea shows its placeholder and a written one does not, which is the difference this
             frame exists to show. It also proves Submit is live: `canSend` is what a written letter buys. */
          expectSelector: "textarea:not(:placeholder-shown)",
        },
        {
          id: "board-applied",
          label: "The Board After Applying",
          note: "Rows they have gone for report the date instead of offering the press again.",
          route: `${BOARD}?viewer=applied`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/JobReferRoleRow.tsx"],
          expect: ["Applied 2d ago", "Applied 9d ago"],
        },
        {
          id: "applied-tab",
          label: "The Applied Tab",
          note: "The same board narrowed to what they have already gone for, grouped by team.",
          route: `${BOARD}?viewer=applied&scope=applied`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/JobBoardScopeTabs.tsx"],
          expect: ["Applied 2d ago"],
          /* Roles from every other team are gone, which is the whole of what the tab does. */
          expectMissing: ["Networking Engineer (Go)"],
        },
        {
          id: "email-preview",
          label: "The Email the Team Gets",
          note: "What leaves the product when someone applies, and the one artifact a member never sees.",
          route: `${BOARD}?email=1`,
          /* Filed with the two apply frames rather than left unkinded. Leaving `kind` off does not keep a
             screen out of the grouped view — it files it under "Other", and the oracle then fails that as a
             group of one, which is the same rule that says a heading over one frame is not a group. It
             belongs here on its own merits: sending the application is what produces it. */
          kind: "Sending the application",
          source: ["prototypes/entries/job-board/email/ApplicationEmailPreview.tsx"],
          expect: [ROLE, "Filecoin Foundation", "polina-bublii-cv.pdf"],
        },
      ],
      edges: [
        { from: "board-ready", to: "apply-letter-empty", label: "Presses Apply on a role" },
        { from: "apply-letter-empty", to: "cv-resting", label: "Presses Edit profile" },
        { from: "cv-resting", to: "cv-replace-reading", label: "Presses Replace" },
        { from: "cv-resting", to: "cv-remove-confirm", label: "Presses Remove" },
        { from: "apply-letter-empty", to: "apply-letter-filled", label: "Types their letter" },
        { from: "apply-letter-filled", to: "board-applied", label: "Presses Submit" },
        { from: "apply-letter-filled", to: "email-preview", label: "When the note is sent" },
        { from: "board-applied", to: "applied-tab", label: "Opens the Applied tab" },
      ],
    },
    {
      /* The gate and the import are ONE journey, not two. They were separate flows until a reviewer asked
         why the import began on a blue editing card: the doors are not a screen of their own, they stand in
         the empty Experience section of the drawer this flow already opens. Splitting them meant the import
         flow had to invent a first frame, and the frame it invented was the wrong route in. */
      id: "empty-profile",
      title: "Filling an Empty Profile",
      note: "Signed in with nothing filled in, where the profile can be typed or read from a document.",
      screens: [
        {
          id: "board-incomplete",
          label: "The Empty Profile Board",
          note: "The account exists, so the ask moves from signing in to finishing the profile.",
          route: `${BOARD}?viewer=profile-incomplete`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/BoardBanners.tsx"],
          expect: ["Update your profile to apply"],
          expectMissing: ["Profile under review", "Browse every open role across the PL network"],
        },
        {
          id: "drawer-empty",
          label: "The Empty Profile Drawer",
          /* THIS FRAME IS ALSO THE IMPORT'S FIRST. On a blank profile the importer mounts `direct` in the
             card at the top of the drawer — drop area already open, no pill to press — so it is already in
             this picture, and a second frame of it would be the same screen twice.

             It said "two doors" until the LinkedIn one was removed: a second entry point landing in the
             same parser was a choice with no consequence. The drop area now carries the LinkedIn fact as
             a disclosure under the box, which is copy rather than a frame. */
          note: "Every card at its empty design, and the CV drop area on the card a blank profile opens with.",
          route: `${BOARD}?viewer=profile-incomplete&profile=1`,
          kind: "The profile drawer",
          source: [
            "prototypes/entries/job-board/JobProfilePane.tsx",
            "prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx",
          ],
          expect: ["Actively looking", "Drag & drop your CV", "On LinkedIn, open your profile and choose"],
          /* The stepper belongs to the waiting state next door, and these two drawers are otherwise close
             enough to photograph alike. */
          expectMissing: ["Await approval confirmation"],
        },
        /* `import-resume` and `import-linkedin` used to be two frames here, one per door, and both are
           gone with the doors themselves — their `?canvas=` states were deleted from
           prototypes/entries/job-board/canvasStates.ts, so the routes photographed an unpinned board while
           the oracle went on asserting "Import from LinkedIn" and "Drag & drop your resume". There is one
           drop area, it is already in `drawer-empty`, and the LinkedIn way in is a disclosure under it
           rather than a screen of its own. */
        {
          id: "import-reading",
          label: "Reading the Document",
          note: "The wait, naming the file, because a spinner alone does not say what it holds.",
          route: `${BOARD}?canvas=import-reading`,
          kind: "Importing a history",
          source: ["prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx"],
          expect: ["Reading polina-bublii-cv.pdf"],
        },
        {
          id: "import-nothing-found",
          label: "Nothing Found in It",
          /* Narrower than it looks. This is the file that yielded *nothing* — not the far commoner one
             whose positions defeated the parser but whose skills and headline did not, which now goes
             to the review instead of here. See `isEmptyParse`. */
          note: "The dead end, which has to offer the way out it took away.",
          route: `${BOARD}?canvas=import-nothing-found`,
          kind: "Importing a history",
          source: ["prototypes/entries/profile-shared/ExperienceImport/ExperienceImportPanel.tsx"],
          expect: ["read details from that file"],
        },
        {
          id: "import-review",
          label: "The Parse, Reviewed",
          note: "What the document said, offered rather than kept, with Cancel and Save under it.",
          route: `${BOARD}?canvas=import-review`,
          kind: "Importing a history",
          source: ["prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx"],
          expect: ["Senior Protocol Engineer"],
          /* The clean parse is defined by the prompt it does NOT carry. */
          expectMissing: ["No dates in the document"],
        },
        {
          id: "import-review-missing-date",
          label: "The Missing Start Date",
          note: "The common failure, asked for inline rather than discovered when Save refuses.",
          route: `${BOARD}?canvas=import-review-missing-date`,
          kind: "Importing a history",
          source: ["prototypes/entries/profile-shared/ExperienceImport/ExperienceImportReview.tsx"],
          expect: ["No dates in the document"],
        },
      ],
      edges: [
        { from: "board-incomplete", to: "drawer-empty", label: "Presses Apply on a role" },
        { from: "drawer-empty", to: "import-reading", label: "Adds a CV file" },
        { from: "import-reading", to: "import-review", label: "When roles are found" },
        { from: "import-reading", to: "import-review-missing-date", label: "When a date is absent" },
        { from: "import-reading", to: "import-nothing-found", label: "When nothing is found" },
      ],
    },
    {
      id: "narrowing",
      title: "Narrowing the Board",
      note: "The rail and the search box, and the dead end a person can narrow themselves into.",
      screens: [
        {
          id: "board-search",
          label: "A Search for a Team",
          note: "The search box matches a team name and keeps that team's roles whole.",
          route: `${BOARD}?viewer=logged-out&q=libp2p`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/JobBoardPrototype.tsx"],
          expect: ["Networking Engineer (Go)"],
          expectMissing: ["Head of Ecosystem Growth"],
        },
        {
          id: "board-filtered",
          label: "The Board Narrowed",
          note: "One axis of the rail in use, with the count in the title reading what survived.",
          route: `${BOARD}?viewer=logged-out&roleCategory=Engineering`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/JobBoardFilterView.tsx"],
          expect: ["Job Board"],
          expectMissing: ["Grants Program Operations Lead"],
        },
        {
          id: "board-no-results",
          label: "No Roles Match",
          note: "Narrowed to nothing, which is a dead end reached by choosing rather than by lacking.",
          route: `${BOARD}?viewer=logged-out&roleCategory=Design&seniority=Principal%2B+(L6-L7)`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/JobBoardPrototype.tsx"],
          expect: ["No roles match your filters. Try clearing some."],
        },
      ],
      edges: [
        { from: "board-search", to: "board-filtered", label: "Picks a role filter" },
        { from: "board-filtered", to: "board-no-results", label: "Picks more filters" },
      ],
    },
    {
      /* THE OTHER SIDE OF THE BOARD: the people who put jobs on it. Modelled on Submit a Deal — a toolbar
         door, a modal, `Submit for review`, and a listing that is not live until the PL team has looked —
         plus the two things deals never had: a place to see the submission while it waits, and a switch to
         take a listing down and bring it back. The lead is Filecoin Foundation's, so every frame here is the
         same team the rest of the canvas applies to. */
      id: "posting",
      title: "Posting a Job",
      note: "A team lead submits a listing, sees it wait on review, then marks it inactive or brings it back.",
      screens: [
        {
          id: "board-lead",
          label: "The Board as a Team Lead",
          note: "Two things change: Submit a job in the toolbar, and a Manage listings tab beside All.",
          route: `${BOARD}?viewer=team-lead`,
          kind: "Board entry states",
          source: ["prototypes/entries/job-board/JobBoardPrototype.tsx", "prototypes/entries/job-board/JobBoardScopeTabs.tsx"],
          expect: ["Submit a job", "Manage listings"],
          /* The lead's pending and taken-down listings are NOT on the public tab — that is the whole rule. */
          expectMissing: ["In review", "Community Manager, Filecoin Ecosystem"],
        },
        {
          id: "submit-job-empty",
          label: "The Submit Form",
          note: "Submit a Deal's modal with the row's own fields, and an optional link to the team's posting.",
          route: `${BOARD}?canvas=submit-job-empty`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/SubmitJobModal.tsx"],
          expect: ["Submit a job", "Posted as Filecoin Foundation", "Submit for review"],
        },
        {
          id: "submit-job-filled",
          label: "The Filled Submit Form",
          note: "A listing typed in, with the selects holding answers and Submit for review live.",
          route: `${BOARD}?canvas=submit-job-filled`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/SubmitJobModal.tsx"],
          expect: ["Developer Relations Engineer", "Saved"],
          expectSelector: 'input[name="roleTitle"]:not(:placeholder-shown)',
        },
        {
          id: "manage-tab-lead",
          label: "Manage Listings",
          note: "The team's listings in every state, where each came from, and the one control that changes it.",
          route: `${BOARD}?viewer=team-lead&scope=manage`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/JobReferRoleRow.tsx", "prototypes/entries/job-board/listings.ts"],
          expect: [
            "Community Manager, Filecoin Ecosystem",
            "In review",
            "Senior Smart Contract Engineer (FVM)",
            "Inactive",
            "Mark inactive",
            "Bring back",
            "Submitted by Hunter Delacroix",
          ],
          expectMissing: ["Networking Engineer (Go)"],
        },
        {
          id: "manage-drawer-in-review",
          label: "The Listing While It Waits",
          note: "The submitted job as its owner sees it, with an In review pill and nothing to press.",
          route: `${BOARD}?canvas=manage-drawer-in-review&scope=manage`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/JobApplyFlowDrawer.tsx", "prototypes/entries/job-board/JobDetailPane.tsx"],
          expect: ["Community Manager, Filecoin Ecosystem", "In review"],
          expectMissing: ["Review job", "Your profile"],
        },
        {
          id: "manage-drawer-live",
          label: "A Live Listing, Owned",
          note: "The same drawer on a live listing: the footer holds Mark inactive where an applicant would see Apply.",
          route: `${BOARD}?canvas=manage-drawer-live&scope=manage`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/JobApplyFlowDrawer.tsx"],
          expect: [ROLE, "Mark inactive", "Live"],
        },
        {
          id: "manage-drawer-inactive",
          label: "An Inactive Listing",
          note: "Taken down, with Bring back as the one thing the footer offers.",
          route: `${BOARD}?canvas=manage-drawer-inactive&scope=manage`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/JobApplyFlowDrawer.tsx"],
          expect: ["Senior Smart Contract Engineer (FVM)", "Bring back", "Inactive"],
        },
        {
          id: "manage-tab-admin",
          label: "Manage Listings as an Admin",
          note: "Every team's listings grouped by team, the review queue across the whole network.",
          route: `${BOARD}?viewer=directory-admin&scope=manage`,
          kind: "The list, narrowed",
          source: ["prototypes/entries/job-board/listings.ts"],
          expect: ["Technical Writer, Specifications", "Community Manager, Filecoin Ecosystem"],
        },
        {
          id: "submit-job-admin",
          label: "The Admin's Submit Form",
          note: "The lead's form with one more field, the team an admin is posting for.",
          route: `${BOARD}?canvas=submit-job-admin`,
          kind: "Managing listings",
          source: ["prototypes/entries/job-board/SubmitJobModal.tsx"],
          expect: ["Select a team"],
          expectMissing: ["Posted as"],
        },
      ],
      edges: [
        { from: "board-lead", to: "submit-job-empty", label: "Presses Submit a job" },
        { from: "submit-job-empty", to: "submit-job-filled", label: "Types the listing" },
        { from: "submit-job-filled", to: "manage-tab-lead", label: "Presses Submit" },
        { from: "manage-tab-lead", to: "manage-drawer-in-review", label: "Opens the one in review" },
        { from: "manage-tab-lead", to: "manage-drawer-live", label: "Opens a live listing" },
        { from: "manage-drawer-live", to: "manage-drawer-inactive", label: "Presses Mark inactive" },
        { from: "manage-tab-lead", to: "manage-tab-admin", label: "Opens it as an admin" },
        { from: "manage-tab-admin", to: "submit-job-admin", label: "Presses Submit a job" },
      ],
    },
  ],
};

/**
 * EVERY CANVAS THIS PROJECT HAS, keyed by the slug that addresses it: `/design-canvas/<slug>`.
 *
 * One entry today. A mobile canvas is the likely second — see the gaps named at the top of this file — and
 * it gets its own slug rather than being folded in here, because the slug namespaces the pictures and the
 * review as well as the URL.
 */
export const CANVASES: CanvasRegistry = {
  "job-board": CANVAS,
};
