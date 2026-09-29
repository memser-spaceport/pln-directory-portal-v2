'use client';

/**
 * REUSE MAP (member-follow)
 * - Page: `member-profile/MemberProfilePrototype` — `MemberProfilePage` with
 *   `askAi="strip"` (the member-ask-ai layout) and `follow`.
 * - Follow: `follow-shared/FollowPill` (the team page's own control, bordered
 *   neutral, "Following ✓") and `follow-shared/FollowToast` for the receipt;
 *   what a member follow means is `follow-shared/types.ts` `MEMBER_PREFS`.
 * - Intro: `intro-shared/RequestIntroButton` — the glossy primary when the
 *   member has no office hours; its sent state is a text receipt
 *   ("✓ Intro requested") so the cluster never shows two check-pills.
 * - Ask AI: the header cluster's text action, plus `member-ask-ai/AskAboutStrip`
 *   question chips under the bio (two on a phone).
 * - Mobbin: Whop (Following ▾ + Message pair, Pay in the corner), Dribbble
 *   (toggles beside one filled "Get in touch"), LinkedIn (every action on the
 *   person in one header row), team profile (Follow beside Ask AI).
 * - No mocks.ts: the page's own fixtures.
 */

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';

/**
 * Member profile with Follow. Every action sits in the header cluster:
 * Ask AI · Follow · one contact press (Schedule Meeting with office hours,
 * Request an intro without — never both). The Ask AI questions stay under the
 * bio as content. A visitor sees no follower count — that is the member's
 * own number, shown only to them.
 */
export default function MemberFollowPrototype() {
  return <MemberProfilePage askAi="strip" follow />;
}
