'use client';

/**
 * REUSE MAP (member-follow)
 * - Page: `member-profile/MemberProfilePrototype` — `MemberProfilePage` with
 *   `askAi="strip"` (the member-ask-ai layout) and `follow`.
 * - Follow: `follow-shared/FollowPill` (the team page's own control, bordered
 *   neutral, "Following ✓") and `follow-shared/FollowToast` for the receipt;
 *   what a member follow means is `follow-shared/types.ts` `MEMBER_PREFS`.
 * - Intro: `intro-shared/RequestIntroButton` — its sent state is a text
 *   receipt ("Intro requested · with the PL team") so the cluster never shows
 *   two check-pills.
 * - Ask AI: `member-ask-ai/AskAboutStrip` under the bio, two chips on a phone.
 * - Mobbin: Whop (Following ▾ + Message pair, Pay in the corner), Dribbble
 *   (toggles beside one filled "Get in touch"), team profile (Follow last,
 *   own row on a phone).
 * - No mocks.ts: the page's own fixtures.
 */

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';

/**
 * Member profile with Follow. Under the bio: Schedule Meeting · Request an
 * intro · Follow — the primary first in a left-aligned row, then the second
 * route to the person, then the standing relationship — with the Ask AI
 * questions under them. The header keeps nothing but the facts. A visitor
 * sees no follower count — that is the member's own number, shown only to
 * them. (A corner placement and a switch between the two were compared and
 * cut: "Keep only button in the bottom, remove in the corner".)
 */
export default function MemberFollowPrototype() {
  return <MemberProfilePage askAi="strip" follow />;
}
