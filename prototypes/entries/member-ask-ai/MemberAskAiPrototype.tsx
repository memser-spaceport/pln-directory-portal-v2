'use client';

/**
 * REUSE MAP (member-ask-ai)
 * - Page: `member-profile/MemberProfilePrototype` — imported whole via its
 *   named `MemberProfilePage` with `askAi="strip"`. Nothing else on the page
 *   changes, so the two entries differ in exactly one decision and can be
 *   compared side by side.
 * - Strip: `./AskAboutStrip` — label + question chips, mounted under the bio
 *   in the header card.
 * - Questions: `member-profile/aiSearchScope.ts` (`buildMemberAiScope`) — the
 *   scope's prompts, first three; a chip opens the view already answering.
 * - Page (2026-11-02): Ask AI and every chip open `ai-search-page` — the AI
 *   Search page as it now ships on develop (/ai-search) — in a NEW TAB, with
 *   Maya attached as context (`?about=member`, plus `?q=` for a chip). The
 *   overlay `ai-search/AiSearchView` is gone from this entry; member-profile
 *   and member-follow still open it.
 * - Paint: DS `Button` (`link` + `primary`) for the text action, the AI glyph
 *   from `prototypes/components/AiSearchIcon`; chips hand-rolled in
 *   token/fallback pairs on the DS control-chip lineage (hover brand).
 * - Mobbin: Delphi "Ask me about" block (three chips under the bio), Mindtrip
 *   "Questions matching your profile", Fabric "Ask AI about this note".
 * - No mocks.ts: the strip draws the profile's own fixtures through the scope.
 */

import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';

/**
 * Member profile with the scope's questions as a strip of chips under the
 * bio. Since 2026-09-28 every profile action — Ask AI included — lives in the
 * header cluster on both entries, so the one decision this entry changes is
 * whether the questions are also on the page (here) or only inside the view
 * (member-profile).
 *
 * Ask AI opens the AI Search page in a new tab rather than a view over the
 * profile: AI Search is a page of its own now, with history and a link per
 * chat, and the profile the question came from stays open in its tab.
 */
export default function MemberAskAiPrototype() {
  return <MemberProfilePage askAi="strip" aiOpens="tab" />;
}
