'use client';

/**
 * REUSE MAP (member-ask-ai)
 * - Page: `member-profile/MemberProfilePrototype` — imported whole via its
 *   named `MemberProfilePage` with `askAi="strip"`. Nothing else on the page
 *   changes, so the two entries differ in exactly one decision and can be
 *   compared side by side (member-profile keeps the header link).
 * - Strip: `./AskAboutStrip` — label + question chips + "Ask your own
 *   question" text action, mounted under the bio in the header card.
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
 * Member profile with "Ask AI" as a strip of questions under the bio instead
 * of a link in the header's action cluster. One page, one changed decision —
 * see `AskAboutStrip` for the argument and `member-profile` for the other
 * half of the comparison.
 */
export default function MemberAskAiPrototype() {
  return <MemberProfilePage askAi="strip" />;
}
