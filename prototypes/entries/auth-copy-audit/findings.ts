/**
 * The auth copy audit as data. Mirrors prototypes/AUTH-COPY-AUDIT.md — when one
 * changes, change the other. Line numbers were swept 2026-07-28 against
 * `consistency-audit`; they drift as the files move.
 */

export type Finding = {
  id: number;
  /** Display label, e.g. "AccountMenu.tsx:111". */
  where: string;
  /** Repo-relative path, for the GitHub-style hint under the label. */
  path: string;
  current: string;
  replacement: string;
  /** Shown when the fix needs a decision rather than a find-and-replace. */
  note?: string;
};

export type Section = {
  key: string;
  letter: string;
  title: string;
  blurb: string;
  findings: Finding[];
};

export const SECTIONS: Section[] = [
  {
    key: 'verb',
    letter: 'A',
    title: 'Wrong verb',
    blurb: 'Buttons, links and menu items that say log in / login / logout where they should say sign in / sign out.',
    findings: [
      {
        id: 1,
        where: 'AccountMenu.tsx:111',
        path: 'components/core/navbar/components/AccountMenu',
        current: 'Logout',
        replacement: 'Sign out',
      },
      {
        id: 2,
        where: 'MemberDetailsLoginStrip.tsx:46',
        path: 'components/page/member-details/member-details-login-strip',
        current: 'Login',
        replacement: 'Sign in',
      },
      {
        id: 3,
        where: 'team-login-info.tsx:25',
        path: 'components/page/team-form-info',
        current: 'Proceed to Login',
        replacement: 'Sign in',
      },
      {
        id: 4,
        where: 'IrlGatheringModal.tsx:478',
        path: 'components/core/UpdatesPanel/IrlGatheringModal',
        current: 'Log in to Respond',
        replacement: 'Sign in to respond',
      },
      {
        id: 5,
        where: 'AccountCreatedSuccessModal.tsx:186',
        path: 'components/page/demo-day/ApplyForDemoDayModal',
        current: 'Log In To Set Up Investor Profile',
        replacement: 'Sign in to set up investor profile',
      },
      {
        id: 6,
        where: 'AccountCreatedSuccessModal.tsx:189',
        path: 'components/page/demo-day/ApplyForDemoDayModal',
        current: 'Log In To Review Investor Profile',
        replacement: 'Sign in to review investor profile',
      },
      {
        id: 7,
        where: 'AppliedInvestorSteps.tsx:93',
        path: 'components/page/demo-day/AppliedInvestorSteps',
        current: "'Log In To ' prefix, concatenated onto “Set Up / Review Investor Profile”",
        replacement: "'Sign in to '",
        note: 'Fixing the prefix alone yields “Sign in to Set Up Investor Profile” — the tail is title-case too, and is used standalone when signed in. Decide whether that signed-in label also becomes sentence case, or whether the two stay divergent on purpose.',
      },
      {
        id: 8,
        where: 'stories/Header.tsx:34',
        path: 'stories',
        current: 'label="Log out"',
        replacement: 'label="Sign out"',
        note: 'Storybook demo header — ships to no user. Include for consistency or skip.',
      },
    ],
  },
  {
    key: 'case',
    letter: 'B',
    title: 'Right verb, wrong case',
    blurb: 'Already “Sign in / Sign up”, but title-cased. Sentence case applies mid-sentence too.',
    findings: [
      {
        id: 9,
        where: 'SessionExpiredModal.tsx:46',
        path: 'components/core/login/components/modals/SessionExpiredModal',
        current: "label: 'Sign In'",
        replacement: "label: 'Sign in'",
        note: 'The same modal’s description already reads “Please sign in again to continue” — the button contradicts the sentence above it. Clearest first fix.',
      },
      {
        id: 10,
        where: 'NotLoggedInState.tsx:40',
        path: 'components/core/UpdatesPanel',
        current: 'Sign In to View Updates',
        replacement: 'Sign in to view updates',
      },
      {
        id: 11,
        where: 'NotLoggedInState.tsx:45',
        path: 'components/core/UpdatesPanel',
        current: 'Sign Up',
        replacement: 'Sign up',
      },
      {
        id: 12,
        where: 'Welcome.tsx:18',
        path: 'components/page/home/Welcome',
        current: 'Sign In',
        replacement: 'Sign in',
      },
      {
        id: 13,
        where: 'AuthSection.tsx:45',
        path: 'components/page/member-details/ForumActivity/…/AuthSection',
        current: 'Sign In',
        replacement: 'Sign in',
      },
      {
        id: 14,
        where: 'AuthSection.tsx:56',
        path: 'components/page/member-details/ForumActivity/…/AuthSection',
        current: 'Sign Up',
        replacement: 'Sign up',
      },
      {
        id: 15,
        where: 'LoggedOutView.tsx:130',
        path: 'components/page/forum/LoggedOutView',
        current: 'Sign Up',
        replacement: 'Sign up',
      },
      {
        id: 16,
        where: 'GuestAccessModal.tsx:61',
        path: 'components/page/aligement-assets/guest-access-modal',
        current: 'Sign Up',
        replacement: 'Sign up',
      },
      {
        id: 17,
        where: 'overview-page.tsx:343',
        path: 'components/page/aligement-assets/overview',
        current: 'Sign Up to Join the Private Beta',
        replacement: 'Sign up to join the private beta',
        note: 'A marketing section title, where neighbouring titles may be title-case by design. Check them before sentence-casing this one alone.',
      },
    ],
  },
  {
    key: 'body',
    letter: 'C',
    title: 'Body copy',
    blurb: 'Toasts, help text and transactional email.',
    findings: [
      {
        id: 18,
        where: 'constants.ts:293 — LOGOUT_MSG',
        path: 'utils',
        current: 'You have been logged out successfully',
        replacement: 'You have been signed out successfully',
      },
      {
        id: 19,
        where: 'constants.ts:295 — LOGGED_IN_MSG',
        path: 'utils',
        current: 'You are already logged in',
        replacement: 'You are already signed in',
      },
      {
        id: 20,
        where: 'constants.ts:753–765',
        path: 'utils',
        current: '…to all logged in members (×7: email, GitHub, Telegram, LinkedIn, Discord, office hours, Twitter)',
        replacement: '…to all signed-in members',
        note: 'One find-and-replace across seven help strings. Note the hyphen: “signed-in members” is attributive, unlike the verb form in #18 and #19.',
      },
      {
        id: 21,
        where: 'constants.ts:1754',
        path: 'utils',
        current: 'link your directory membership email to a login method of your choice',
        replacement: '…to a sign-in method of your choice',
        note: 'Transactional email HTML — ships outside the app. Confirm the template isn’t duplicated server-side before calling it done.',
      },
      {
        id: 22,
        where: 'team-login-info.tsx:19',
        path: 'components/page/team-form-info',
        current: 'You need to sign in to submit a team.Please login to proceed.',
        replacement: 'You need to sign in to submit a team.',
        note: 'Carries a real bug, not just wrong copy: missing space after the full stop, and the sentence says the same thing twice. The button directly below already says what to do.',
      },
      {
        id: 23,
        where: 'faqs.tsx:41',
        path: 'components/page/aligement-assets/faqs',
        current: 'including login problems or wallet access',
        replacement: 'including sign-in problems or wallet access',
      },
    ],
  },
  {
    key: 'a11y',
    letter: 'D',
    title: 'Assistive text',
    blurb: 'Not visible, but read aloud.',
    findings: [
      {
        id: 24,
        where: 'userProfile.tsx:86',
        path: 'components/core/navbar',
        current: 'alt="logout"',
        replacement: 'alt=""',
        note: 'The icon sits inside an already-labelled control, so the fix is to make it decorative rather than translate the word — otherwise it announces twice.',
      },
      {
        id: 25,
        where: 'AccountMenu.tsx:111',
        path: 'components/core/navbar/components/AccountMenu',
        current: '<LogoutIcon /> Logout',
        replacement: '<LogoutIcon /> Sign out',
        note: 'Same control as #1 — the icon component name stays, only the text changes.',
      },
    ],
  },
];

export type Exclusion = { what: string; where: string; why: string };

export const EXCLUSIONS: Exclusion[] = [
  {
    what: '#login hash route',
    where: '~25 files — router.push(…#login), redirect(…#login), proxy.ts:54',
    why: 'Deep links and email links point at it; renaming breaks them',
  },
  {
    what: 'auth:init-login, auth:login-success, auth:logout, auth:logout-success',
    where: 'components/core/login/utils/authEvents.ts',
    why: 'Internal event contract',
  },
  {
    what: 'PostHog event names',
    where: 'analytics/*.analytics.ts, utils/constants.ts',
    why: 'Renaming silently breaks historical dashboards',
  },
  {
    what: 'Component and file names',
    where: 'LoginBtn, LoginFlowTrigger, NotLoggedInState, MemberDetailsLoginStrip, team-login-info.tsx, LoggedOutView',
    why: 'Identifiers, not copy',
  },
  {
    what: 'CSS class names',
    where: '.login-info, .loginButton, .signInButton, .triggerLoginButton',
    why: 'Identifiers',
  },
  {
    what: 'localStorage key directory-logout',
    where: 'components/core/login/components/PrivyModals/PrivyModals.tsx:387',
    why: 'Changing it signs everyone out mid-session',
  },
  {
    what: 'API path /v1/auth/login-token/redeem',
    where: 'services/auth.service.ts:147',
    why: 'Backend contract',
  },
  {
    what: 'Asset URLs',
    where: 'login-banner.png, /icons/logout.svg',
    why: 'Hosted filenames',
  },
  {
    what: 'Test assertions on #login',
    where: '__tests__/page/home/*, __tests__/core/login/*',
    why: 'They follow the route, not the copy',
  },
  {
    what: 'Changelog entry “Removed the strict login gate”',
    where: 'components/page/aligement-assets/product-versions/product-versions.tsx:46',
    why: 'Historical record of what shipped; rewriting it falsifies it',
  },
];

export const ORDER: string[] = [
  '#9 — the button contradicting its own modal description.',
  'Section B — pure casing, no wording judgement, 9 strings.',
  'Section A minus #7 — straightforward verb swaps.',
  '#20 — the seven-way help-text replace.',
  '#7, #17, #22 — each needs a decision, not just a replacement.',
  '#24 — an a11y fix that happens to touch the same word.',
];

export const TOTAL = SECTIONS.reduce((n, s) => n + s.findings.length, 0);
export const FILE_COUNT = 15;
export const SWEPT_ON = '28 July 2026';
export const BRANCH = 'consistency-audit';
