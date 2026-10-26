# Tasks

## 1. Dependencies

- [x] 1.1 Keep `isomorphic-dompurify` 2.22.0 and add `dompurify` `^3.4.17` to `dependencies` with `npm install` (not a hand edit). Verify that `npm ls dompurify` shows exactly one version, 3.4.17 or later, and that `package-lock.json` has no second `node_modules/**/dompurify` entry.
- [x] 1.2 Run `npm test`. Fix only the exact-string expectations that changed because of dompurify 3.4.x serialization (for example `__tests__/utils/sanitizeForumPostHtml.test.ts`). Verify that the suite passes and no assertion was loosened beyond serialization.
- [ ] 1.3 Run `npm run build` under Node 22.23.4. Verify that it succeeds and that the Vercel preview build on the PR passes.

## 2. One sanitizer module

- [x] 2.1 Add `utils/html/sanitizeHtml.ts`: `SANITIZE_PROFILES` (move the comment, forumPost, aiAppFeedback, jobDescription, spv configs from their files, the PRD config from `PrdContent`, and the team news config from `NewsDetailBody`; add `richText` and `searchHighlight` per design §2 and §4), `sanitizeHtml(html, profile = 'richText')`, and the single `afterSanitizeAttributes` link hook. Verify that a new `__tests__/utils/sanitizeHtml.test.ts` covers each spec scenario of "Code in member or AI HTML never runs", "Allowed formatting still shows" and "Links in member or AI HTML are safe" against `richText`.
- [x] 2.2 Add the `style` property filter (design §2) and test it with `url(`, `expression(`, `var(`, `!important` on a banned property, uppercase property names and CSS comments. Verify that only `color` and `background-color` survive, and only on `richText`.
- [x] 2.3 Reduce `sanitizeCommentHtml`, `sanitizeForumPostHtml`, `sanitizeAiAppFeedbackHtml`, `sanitizeJobDescriptionHtml` and `sanitizeSpvHtml` to wrappers over `sanitizeHtml`. Keep the `*_SANITIZE_CONFIG` re-exports and remove their `addHook` calls. Verify that their existing test files pass unchanged (apart from 1.2) and that `git grep -n addHook -- utils components` shows one hit.
- [x] 2.4 Add `utils/html/parseSafeHtml.ts` and export it, `sanitizeHtml` and `SANITIZE_PROFILES` from `utils/html/index.ts`. Verify with a test that `parseSafeHtml('<p onclick=x>a</p><script>b</script>', 'forumPost')` yields one `<p>` element with no props other than children.

## 3. Safe-render component

- [x] 3.1 Add `components/ui/SafeHtml/SafeHtml.tsx` (`html`, `profile`, `as`, `className`, memoized sanitize, not a client component) and its test. Verify that the test renders a script/handler payload and finds no `script` and no `on*` attribute, and that it renders in a server component (`renderToString`).
- [x] 3.2 Make `QuillContent` render through `SafeHtml`. Replace the `sanitize` prop with `profile` (default `richText`) and update `FeedbackBody` to `profile="aiAppFeedback"`. Verify that `__tests__/page/ai-apps/ai-app-feedback-page.test.tsx` passes and a new QuillContent test shows a deal description with `<script>` rendering without it.

## 4. Migrate render sites

- [ ] 4.1 Before switching profile pages, run read-only on the dev DB (pln-pg): count `Member.bio`, `Team.longDescription`, `Project.description` and `MemberExperience.description` rows that contain `<img`, `<iframe` or a `style=` with a property other than color/background-color. Record the counts on LAB-2986. Verify that the comment exists. If any `<img>` count is non-zero, wait for a decision before 4.2.
- [x] 4.2 Members: `member-details/BioDetails/components/BioView/BioView.tsx`, `ProfileDetails/ProfileDetails.tsx`, `ProfileDetails/components/ProfileBio/ProfileBio.tsx`, `member-details/bio.tsx`, `member-details/experience/experience-description.tsx` (drop the `dompurify` import and the `useEffect`; clip the sanitized string), `member-details/member-experience-item.tsx` (all three renders), `home/featured/member-bio-modal.tsx`, `home/featured/member-card.tsx`. Verify that their existing tests pass, with `member-experience-item.test.tsx` no longer mocking `isomorphic-dompurify`, and that `/members/<uid>` server HTML still contains the bio text (profiles spec).
- [x] 4.3 Teams and projects: `team-details/TeamDetails/TeamDetails.tsx`, `TeamDetails/components/About/About.tsx`, `team-details/asks-section.tsx`, `asks-section/components/TeamAsksItem/TeamAsksItem.tsx`, `teams/asks-popover.tsx`, `core/edit-ask-dialog/components/AskDetails/AskDetails.tsx`, `project-details/description.tsx`, `home/featured/project-card.tsx`. Verify that their tests pass and that `/teams/<uid>` and `/projects/<uid>` server HTML still contain about/description text.
- [x] 4.4 Events, demo day, pitch: `irl/events/irl-events-table-view.tsx`, `irl/events/irl-past-events.tsx`, `home/featured/irl-card.tsx`, `common/DemoDayCard/DemoDayCard.tsx`, `demo-day/ApplyForDemoDayModal/ApplyForDemoDayModal.tsx`, `demo-day/DemodayCompletedView/DemodayCompletedView.tsx`, `demo-day/PageTitle/PageTitle.tsx`, `pitch/PitchEventHeader.tsx`, `pitch/PitchSpotlightHero.tsx` (keep the `&nbsp;` normalization before `SafeHtml`). Verify that their tests pass.
- [x] 4.5 Feature allowlists: `ai-apps/components/PrdContent/PrdContent.tsx` (`prd`), `home/TeamNews/components/NewsDetailModal/NewsDetailBody.tsx` (`teamNews`; the "has content" checks use the sanitized value, no leftover `sanitizedContentHtml` name), `jobs/JobDetailPane/JobDetailPane.tsx` (`jobDescription`), `spv-spotlight/SpvHero/SpvHero.tsx` and `SpvTeamCard/SpvTeamCard.tsx` (`spv`), `founders/FounderMethodologyModal/FounderMethodologyModal.tsx` (`richText`; tables). Verify that `prd-content.test.tsx`, `news-detail-modal.test.tsx`, `job-detail-pane.test.tsx` and the SPV tests pass unchanged.
- [x] 4.6 `html-react-parser` sites: `forum/Post/Post.tsx`, `forum/PostComments/components/CommentItem/CommentItem.tsx`, `forum/Posts/Posts.tsx` (`forumPost`), `application-search/.../ResultItem/ResultItem.tsx` and `.../ForumResultItem/ForumResultItem.tsx` (`searchHighlight`; first confirm the highlight tag in a real dev search response and adjust the profile if it is not `em`/`mark`), `FeedCommentContent.tsx` and `ForumPostModal.tsx` (switch to `parseSafeHtml`). Verify with a test per forum renderer that an `<iframe>` body renders no iframe, and that the feed comment and forum modal tests pass unchanged.
- [x] 4.7 `core/navbar/notification-card.tsx`: render the title as a text child. Verify with a test that a member name `<img src=x onerror=alert(1)>` shows as literal text.
- [x] 4.8 Run `git grep -n "dangerouslySetInnerHTML" -- components app`. Verify that the only hits are the two JSON-LD pages and `changelog-list.tsx` (`SafeHtml` and `safeHtmlProps` set the prop without the JSX attribute).

## 5. Lint guard

- [x] 5.1 Add the rules from design §6 to `eslint.config.mjs` and the three reasoned `eslint-disable-next-line` comments. Verify that `npx eslint components app utils` reports zero `react/no-danger` and zero `no-restricted-imports` errors.
- [x] 5.2 Add `__tests__/lint/no-raw-html.test.ts`, which runs `ESLint.lintText` on a fixture with `dangerouslySetInnerHTML` and on one importing `isomorphic-dompurify` (as `components/x/Fixture.tsx`). Verify that each yields exactly one error from the expected rule.

## 6. Docs and spec

- [x] 6.1 Add the rule "render member/AI HTML only through `SafeHtml` / `parseSafeHtml`; add a profile in `utils/html/sanitizeHtml.ts` instead of a local config" to AGENTS.md and CLAUDE.md (same PR, per the stack-change rule). Verify that both files contain it.
- [ ] 6.2 Resolve the open question (keep `color`/`background-color`) with Vova on LAB-2986. If the answer is "drop", update `richText.styleProperties` and the "Editor text color" scenario. Verify that the ticket has the answer.

## 7. Integration checks

- [x] 7.1 Run `npm run lint`. Verify that the changed files have no errors that `develop` does not already have, and the repo-wide count is not higher than `develop`'s.
- [x] 7.2 Run `npm run test` and `npm run build`. Verify that both pass.
- [x] 7.3 Run `openspec validate safe-html-rendering --json` (with `OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1`). Verify that `valid: true`.
- [ ] 7.4 On dev (or feature env `lab-2986`), open a member profile, a team profile, a project, an IRL event, a forum post, a deal and a Gantry item with known formatted content. Verify that links, lists, bold and editor colors look the same as on production, and that a test bio with `<script>` and `onerror` shows no alert.
- [ ] 7.5 Archive the change in the same PR (`openspec archive safe-html-rendering`). Verify that `openspec/specs/html-content-safety/spec.md` exists.
