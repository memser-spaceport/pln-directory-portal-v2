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
 * - View: `ai-search/AiSearchView` with `scope` + `request` ({question,
 *   origin: null, nonce}) — the same view the team profile opens.
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
 */
export default function MemberAskAiPrototype() {
  return <MemberProfilePage askAi="strip" />;
}
