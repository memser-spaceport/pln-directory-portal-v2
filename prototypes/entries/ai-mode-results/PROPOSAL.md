# AI mode — answer components refresh

Route: `/prototypes/ai-mode-results` (review band → **Answers: Current / Proposed**, default Proposed, opens on the two-turn "Filecoin teams in Berlin" chat; "Lumen Storage vs Saturn Grid" in History shows the table).

Source: design review 2026-10-05. Anuj: the AI mode page's flow and UX are fine; once you are chatting, "some of those components are still kind of old". This is a **visual, component-level pass**. The flow, page chrome, turn data and the mocked answers are unchanged. The switch redraws the same conversation.

Code: `proposed/ProposedAnswerPanel.tsx` is a drop-in for `prototypes/entries/ai-search/AnswerPanel.tsx`. It takes the same props and the same `Turn`s, and reuses that panel's page frame (`AnswerPanel.module.scss` root / messages / inputWrap). Every value is a `var(--token, #fallback)` pair.

## Production baseline (what an engineer will meet)

- `components/core/application-search/components/AnswerView/AnswerView.tsx` is the live answer: question, "N source(s)" `InfoBox`, `Markdown`, `DirectoryResultCards`, `FollowupQuestions`, actions.
- `components/common/Markdown.tsx` sets every link to `style={{ color: 'blue' }}`, prints `[n]` citations as blue text from `sourceRefs`, and gives each `<p>` an inline 14/22.
- `components/page/husky/followup-questions.tsx` has an orange title, `#f1f5f9` slabs and black text.
- `components/core/application-search/components/DirectoryResultCards` has a 2-col grid and per-type glyphs. It has no pictures, because `actions` carries no image.
- `components/core/husky/husky-answer-loader.tsx` and `husky-source-card.tsx`.

## Components: before → after

| # | Component | Before (current AI mode) | After (proposed) | Why | Maps to (production) | Prototype file |
|---|---|---|---|---|---|---|
| 1 | **Turn layout** | 18/600 question heading over a white bordered card holding the whole answer | Question in a right-aligned grey bubble (`--background-neutral-subtle`, 18/18/4/18 radius, max 80%). The answer runs on the page with no card, and its parts sit 20px apart. Turns are 40px apart (32px on phones) | A bordered box around every reply is the dated chatbot look. ChatGPT, Gemini, Claude, Dash, Customer.io and Google AI Mode all use bubble + open answer. With no card, only things that really are objects (table, results) get borders. On phones the card was also eating 32px of a 358px column | `AnswerView .turn/.question`; husky `preview-message` | `ProposedAnswerPanel.tsx` / `.module.scss` (`.turn`, `.ask`, `.answer`) |
| 2 | **Answer typography** | 14px; the card sets 26px leading and Markdown's inline styles set 22px; links in bold `#0000ff` | 16/26 desktop and 16/24 phone, 12px between paragraphs, tertiary list markers, 4px between list items, 600 bold. One stylesheet owns it, with no inline styles | 16px is the reading size of every current answer surface, and the 768px column is built for it. Two leadings fighting is what made paragraphs look uneven | `Markdown.tsx` overrides (drop the inline `p` style, add a className hook) | `proposed/AnswerProse.tsx` / `.module.scss` (`.prose`) |
| 3 | **Entity mentions** (links to directory records in the prose) | Bold blue link | The record's 16px picture + name in primary 500 with a hairline underline, brand on hover. `nowrap` keeps the picture with its name | A mention of a team is the team, not a URL. The picture makes it scannable and tells you what kind of thing it is. `#0000ff` isn't a PL colour | `Markdown.tsx` `anchorWrapper` (a directory href → mention) | `AnswerProse.tsx` (`Anchor`, `.mention`) |
| 4 | **Inline citations** | None in AI mode (production prints `[1]` as blue text) | A numbered grey pill right after the sentence it supports ("…archives.¹"). Hover/focus opens a source card (picture, "Team · host", title, Open ↗). Brand on hover. `display: inline` so the number never wraps away from its sentence | ChatGPT / Perplexity / Gemini Notebook citation chips. Production already has the data (`sourceRefs` + `[n](url)`), only the drawing is old | `Markdown.tsx` citation branch + `huskySourceRefSchema` | `AnswerProse.tsx` (`Citation`, `.cite`, `.card`), `entities.ts` (`sourceRefsFor`, `withCitations` (mock-only marker placement)) |
| 5 | **Sources list** | "N sources" pill at the right end of the actions row; unnumbered rows with initials | Same pill and popover chrome (reused), now **leading** the actions row. Rows are numbered to match the citations and use record pictures | The numbers are what tie the prose to the list. The current file refused numbers because "the wire has no mapping", but production's wire does | `InfoBox` + `HuskySourceCard` in `AnswerView` | `proposed/SourcesButton.tsx` (+ ai-search `AnswerSources.module.scss`) |
| 6 | **Directory results** (members / teams / projects / events) | Brand-blue gear heading; 2×2 grid of separately bordered cards, each with an arrow | One 12px panel of 56px rows with hairline dividers: 32px picture (circle = person, rounded square = rest), name 14/500, "Type · fact" 12px. Production `OhBadge` "Available to connect" on members with office hours (under the meta line on phones). Chevron = stays in the directory, ↗ = external. "Show all (N)" is the panel's last row | One object reads as "the set this answer found", while four boxes read as four ads. The row has room for the one fact that changes what you do next (office hours). The heading is a label, not a link | `DirectoryResultCards` (application-search) | `proposed/EntityList.tsx` / `.module.scss` |
| 7 | **Comparison table** | DS table: grey header including the empty corner, tertiary 12px row labels, "None listed", 560px min-width that scrolls sideways on phones | Entities lead (24px picture + 14/600 name, linking), white corner, column rules, secondary 12/500 labels (tertiary 12px fails 4.5:1), "—" for nothing (words kept for screen readers). **Phones:** fact blocks with the label on its own line and the values side by side under the two column heads, no sideways scroll | The table should read "A vs B" before any fact. On a phone, half of every comparison was off screen | No structured blocks in production yet; `Markdown.tsx` table overrides (`#ddd` / `#f5f5f5`) are today's table | `proposed/AnswerShapes.tsx` / `.module.scss` |
| 8 | **Answer actions** | Regenerate, edit, copy, 👍, 👎 (a rotated thumbs-up) at the bottom of the card with 24px targets; sources at the far right | Under what they act on, before the follow-ups: sources pill, copy (✓ for 1.5s), 👍, 👎 (DS `ThumbsDownIcon`), then a hairline and regenerate + edit (last turn only). 28px targets. Copy and regenerate are production's own SVGs, painted with `currentColor` via CSS mask. Thumbs-down still opens the "What was wrong?" panel, now a soft-surface 12px panel | Answer-level presses first and last-turn-only presses after, so older turns keep the same left edge (ChatGPT). Actions sit next to the content, not below the next-step list | `AnswerView .actions`, `chat-actions.tsx` | `ProposedAnswerPanel.tsx` (`Actions`) |
| 9 | **Follow-up questions** | Orange "Follow up questions" + lightbulb; full-width grey slabs with black text | "Follow-up questions" in the shared section label (14/600 primary), then a hairline-divided list of 44px rows with a ↳ glyph, brand on hover, tertiary while answering. Last part of the turn, nearest the composer | Orange isn't in the PL palette, and grey slabs read as disabled inputs. Perplexity, Reddit Answers and Fireflies use quiet rows. ↳ says "continues this thread" | `followup-questions.tsx` | `ProposedAnswerPanel.tsx` (`FollowUps`) |
| 10 | **Thinking / streaming** | AI mark breathing + one shimmering step label (Understanding → Searching → Found N → Writing) | Same step copy and shimmer, plus: the mark in a 28px brand disc with an orbiting arc (alive), a four-segment step meter (how far, each segment is a real step), all segments lit + "Taking longer than usual" when overdue. While words stream, a 2px brand caret blinks after the last word. Reduced motion is respected | Lesson 19: the label says *what* is happening but never *how far*. A step counter is the honest "how far" for a status-only backend. The caret puts "still writing" where the eye already is | `husky-answer-loader.tsx`; current `ai-search/AnswerStatus.tsx` | `proposed/ThinkingStatus.tsx` / `.module.scss`, `AnswerProse` (`Caret`) |

## What did not change

- Flow: ask, stream, follow-ups, regenerate/edit, thumbs + reason panel, Show all, scoped answers ("Retrieved:" line, lock pill, section door), the composer, the history rail, the title bar.
- Data: the same `CannedAnswer`s from `ai-search/mocks.ts`. Citation markers are placed by `withCitations` only because the mocks predate `sourceRefs`.
- The page frame (768px reading column, pinned input).

## Judgement calls

- **No answer card.** This is the biggest visual move. Scoped answers (team-profile "Ask AI") lose their card too, and the "Retrieved:" line now leads the open answer.
- **Question as a bubble, not a heading.** The title bar already names the chat, so the heading was a second title. The bubble is "what you asked".
- **Actions moved above follow-ups.** It's a reorder, not a new control. Called out because it changes where the eye finds copy/thumbs.
- **Request an intro is not on member rows.** The 2026-09-28 standup dropped the intro from AI-search rows (people want to see the profile first). The row opens the profile, and "Available to connect" is the signal shown instead.
- **Follow-ups still show on every turn**, as today. Showing them only on the last turn (ChatGPT) would cut clutter, but it removes something, so it's left as a question.

## Open questions

1. Should older turns hide their follow-ups (last turn only)?
2. Citations need the backend to send `sourceRefs` with `[n]` markers in AI mode (the popover answer already has them). Can we confirm AI mode's stream carries them?
3. Entity pictures in rows and mentions need `actions` (or the stream) to carry `image` + one fact per record. Production `DirectoryResultCards` notes this gap.
4. Should "Available to connect" on a row open the booking directly, or stay a label (today: label; the row opens the profile)?
5. Comparison table with 3+ columns on phones: fact blocks get to ~110px per value. Allow scroll from 3 columns up?

## References (Mobbin)

- ChatGPT, answer on the page + source chips + actions under the answer: https://mobbin.com/screens/73833b79-1dd5-4354-8fc4-a2e99c33a75e
- Gemini Notebook, numbered inline citation pills + follow-up rows: https://mobbin.com/screens/e5ced159-147b-4772-bb7b-78d83dba09ef
- Dropbox Dash, inline source chips, "1 source" beside thumbs, "Ask a follow-up" list: https://mobbin.com/screens/fc54be30-29ff-430c-9554-7858c47373e8
- Customer.io, bubble question, open answer, references popover: https://mobbin.com/screens/fafcbfb9-fa85-4b4d-b17f-54df962305b5
- Reddit Answers, "Generated from these posts" cards, Related rows: https://mobbin.com/screens/6f7ad862-9d75-444b-9f29-a941b9e6292d
- Fireflies, references list, quiet suggested-question rows: https://mobbin.com/screens/0e277c22-7dac-4085-aa59-cd24cd3dbc52
- Perplexity Finance, entity rows in one panel (Peers), "N sources" stacks: https://mobbin.com/screens/e0f4d302-6730-4440-977e-8a30b5a92a31
- Plane Pi, step-by-step thinking state: https://mobbin.com/screens/19249595-3bcc-418f-88e5-15d5b60ea3af
