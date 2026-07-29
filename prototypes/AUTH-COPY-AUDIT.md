# Auth copy audit — "Log in" → "Sign in"

Every visible string in the app that needs to change, with file, line, current text
and replacement. Swept 2026-07-28 against `consistency-audit`.

## The standard

- **Sign in · Sign up · Sign out** — always these verbs, never *log in / login / logout*.
- **Sentence case** — "Sign in", not "Sign In". Applies mid-sentence too:
  "Sign in to view updates", not "Sign In to View Updates".
- **Visible strings only.** Identifiers, routes, events and analytics names are
  explicitly out of scope — see the exclusion list at the bottom. Renaming those
  breaks deep links and analytics dashboards without changing a single pixel.

Total: **25 strings across 15 files.** None of it is behavioural — every change is
a string literal or a JSX text node.

---

## A. Wrong verb — buttons, links, menu items

These say *log in / login / logout* where they should say *sign in / sign out*.

| # | Location | Current | Replace with |
|---|---|---|---|
| 1 | [AccountMenu.tsx:111](../components/core/navbar/components/AccountMenu/AccountMenu.tsx#L111) | `Logout` | `Sign out` |
| 2 | [MemberDetailsLoginStrip.tsx:46](../components/page/member-details/member-details-login-strip/MemberDetailsLoginStrip.tsx#L46) | `Login` | `Sign in` |
| 3 | [team-login-info.tsx:25](../components/page/team-form-info/team-login-info.tsx#L25) | `Proceed to Login` | `Sign in` |
| 4 | [IrlGatheringModal.tsx:478](../components/core/UpdatesPanel/IrlGatheringModal/IrlGatheringModal.tsx#L478) | `Log in to Respond` | `Sign in to respond` |
| 5 | [AccountCreatedSuccessModal.tsx:186](../components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal.tsx#L186) | `Log In To Set Up Investor Profile` | `Sign in to set up investor profile` |
| 6 | [AccountCreatedSuccessModal.tsx:189](../components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal.tsx#L189) | `Log In To Review Investor Profile` | `Sign in to review investor profile` |
| 7 | [AppliedInvestorSteps.tsx:93](../components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.tsx#L93) | `Log In To ` (prefix concatenated onto "Set Up / Review Investor Profile") | `Sign in to ` |
| 8 | [stories/Header.tsx:34](../stories/Header.tsx#L34) | `label="Log out"` | `label="Sign out"` |

**#7 is the one to read carefully.** It builds the label by concatenation:
`` `${!isLoggedIn ? 'Log In To ' : ''}${isNew ? 'Set Up Investor Profile' : 'Review Investor Profile'}` ``.
Fixing the prefix alone yields "Sign in to Set Up Investor Profile" — the tail is
title-case too. Sentence-casing the whole label means changing both halves, and the
tail is also used standalone when signed in. Decide whether the signed-in label
becomes sentence case as well, or keep the two cases divergent on purpose.

**#8 is Storybook only** — a demo header, not product surface. Include it for
consistency or skip it; it ships to no user.

---

## B. Right verb, wrong case

Already "Sign in/up", but title-cased.

| # | Location | Current | Replace with |
|---|---|---|---|
| 9 | [SessionExpiredModal.tsx:46](../components/core/login/components/modals/SessionExpiredModal/SessionExpiredModal.tsx#L46) | `label: 'Sign In'` | `label: 'Sign in'` |
| 10 | [NotLoggedInState.tsx:40](../components/core/UpdatesPanel/NotLoggedInState.tsx#L40) | `Sign In to View Updates` | `Sign in to view updates` |
| 11 | [NotLoggedInState.tsx:45](../components/core/UpdatesPanel/NotLoggedInState.tsx#L45) | `Sign Up` | `Sign up` |
| 12 | [Welcome.tsx:18](../components/page/home/Welcome/Welcome.tsx#L18) | `Sign In` | `Sign in` |
| 13 | [AuthSection.tsx:45](../components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/AuthSection/AuthSection.tsx#L45) | `Sign In` | `Sign in` |
| 14 | [AuthSection.tsx:56](../components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/AuthSection/AuthSection.tsx#L56) | `Sign Up` | `Sign up` |
| 15 | [LoggedOutView.tsx:130](../components/page/forum/LoggedOutView/LoggedOutView.tsx#L130) | `Sign Up` | `Sign up` |
| 16 | [GuestAccessModal.tsx:61](../components/page/aligement-assets/guest-access-modal/GuestAccessModal.tsx#L61) | `Sign Up` | `Sign up` |
| 17 | [overview-page.tsx:343](../components/page/aligement-assets/overview/overview-page.tsx#L343) | `Sign Up to Join the Private Beta` | `Sign up to join the private beta` |

**#9 sits next to already-correct copy.** The same modal's description reads
"Please sign in again to continue" — so the button contradicts the sentence above it.
Good one to fix first; it's the clearest evidence the standard is real.

**#17 is a marketing section title** on the alignment-assets overview, where
surrounding titles may be title-case by design. Check its neighbours before
sentence-casing it alone.

---

## C. Body copy

| # | Location | Current | Replace with |
|---|---|---|---|
| 18 | [constants.ts:293](../utils/constants.ts#L293) `LOGOUT_MSG` | `You have been logged out successfully` | `You have been signed out successfully` |
| 19 | [constants.ts:295](../utils/constants.ts#L295) `LOGGED_IN_MSG` | `You are already logged in` | `You are already signed in` |
| 20 | [constants.ts:753, 755, 757, 759, 761, 763, 765](../utils/constants.ts#L753) | `…to all logged in members` (×7: email, GitHub, Telegram, LinkedIn, Discord, office hours, Twitter) | `…to all signed-in members` |
| 21 | [constants.ts:1754](../utils/constants.ts#L1754) | `link your directory membership email to a login method of your choice` | `…to a sign-in method of your choice` |
| 22 | [team-login-info.tsx:19](../components/page/team-form-info/team-login-info.tsx#L19) | `You need to sign in to submit a team.Please login to proceed.` | `You need to sign in to submit a team.` |
| 23 | [faqs.tsx:41](../components/page/aligement-assets/faqs/faqs.tsx#L41) | `including login problems or wallet access` | `including sign-in problems or wallet access` |

**#20 is one find-and-replace** — seven help-text strings sharing the same phrasing.
Note the hyphen: "signed-in members" is attributive, so it hyphenates, unlike the
verb form in #18/#19.

**#22 carries a real bug**, not just wrong copy: there's a missing space after the
full stop (`team.Please`), and the sentence says the same thing twice. The proposed
replacement drops the second clause entirely — the button right below it already
says what to do.

**#21 is transactional email HTML**, so it ships outside the app. Worth confirming
whether the template is also duplicated server-side before calling it done.

---

## D. Assistive text

| # | Location | Current | Note |
|---|---|---|---|
| 24 | [userProfile.tsx:86](../components/core/navbar/userProfile.tsx#L86) | `alt="logout"` | Screen-reader text on the icon inside the sign-out control |
| 25 | [AccountMenu.tsx:111](../components/core/navbar/components/AccountMenu/AccountMenu.tsx#L111) | `<LogoutIcon /> Logout` | Same control as #1 — the icon component name stays, only the text changes |

For #24 the icon sits inside a labelled control, so the better fix is `alt=""` —
decorative — rather than translating the word. Announcing "logout" *and* the button
label is a duplicate announcement.

---

## Explicitly out of scope — do not rename

A future sweep will match these; they are deliberate exclusions.

| What | Where | Why |
|---|---|---|
| `#login` hash route | ~25 files (`router.push(…#login)`, `redirect(…#login)`, `proxy.ts:54`) | Deep links and email links point at it; renaming breaks them |
| `auth:init-login`, `auth:login-success`, `auth:logout`, `auth:logout-success` | [authEvents.ts](../components/core/login/utils/authEvents.ts) | Internal event contract |
| PostHog event names | `analytics/*.analytics.ts`, `utils/constants.ts` (e.g. `session-expired-popup-login-btn-clicked`, `on-login-button-clicked`) | Renaming silently breaks historical dashboards |
| Component + file names | `LoginBtn`, `LoginFlowTrigger`, `NotLoggedInState`, `MemberDetailsLoginStrip`, `team-login-info.tsx`, `LoggedOutView` | Identifiers, not copy |
| CSS class names | `.login-info`, `.loginButton`, `.signInButton`, `.triggerLoginButton` | Identifiers |
| `localStorage` key | `directory-logout` in [PrivyModals.tsx:387](../components/core/login/components/PrivyModals/PrivyModals.tsx#L387) | Changing it signs everyone out mid-session |
| API path | `/v1/auth/login-token/redeem` in [auth.service.ts:147](../services/auth.service.ts#L147) | Backend contract |
| Asset URLs | `login-banner.png`, `/icons/logout.svg` | Hosted filenames |
| Test assertions on `#login` | `__tests__/page/home/*`, `__tests__/core/login/*` | Follow the route, not the copy |
| Changelog entry | [product-versions.tsx:46](../components/page/aligement-assets/product-versions/product-versions.tsx#L46) — "Removed the strict login gate" | Historical record of what shipped; rewriting it falsifies it |

---

## Suggested order

1. **#9** — the button contradicting its own modal description.
2. **Section B** — pure casing, no wording judgement, 9 strings.
3. **Section A** minus #7 — straightforward verb swaps.
4. **#20** — the seven-way help-text replace.
5. **#7, #17, #22** — each needs a decision, not just a replacement.
6. **#24** — an a11y fix that happens to touch the same word.

After the sweep, this regex should return only excluded matches:

```
rg -n "Log ?[Ii]n|Log ?[Oo]ut|Sign In|Sign Up|Sign Out" --glob '!**/node_modules/**'
```
