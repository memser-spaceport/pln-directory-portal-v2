# Design

## Context

See proposal.md for why. State of `origin/develop` (9ad04f6ea):

- 37 `dangerouslySetInnerHTML` sites in `components/` and `app/`. Seven sanitize with a feature allowlist from `utils/html/` (comment, forum post, AI app feedback, job description, SPV) or with a local config (`PrdContent`, `NewsDetailBody`). Five call `DOMPurify.sanitize` with the default config (`member-card`, `project-card`, `irl-card`, `ProfileDetails`, `member-experience-item`). `experience-description` imports the browser-only `dompurify` with an ad-hoc config. The rest render raw.
- `QuillContent` renders `linkifyHtml` output and sanitizes only when the caller passes `sanitize`. Only `FeedbackBody` does. Deals, Gantry and guide comments render raw.
- `html-react-parser` `parse()` runs on unsanitized NodeBB HTML in `forum/Post`, `forum/PostComments/CommentItem` and `forum/Posts`, and on search highlight snippets in `ResultItem` and `ForumResultItem`. `FeedCommentContent` and `ForumPostModal` sanitize first.
- `notification-card` interpolates `targetMember.name` into a string and renders it as HTML.
- Every sanitizer module registers the same global `afterSanitizeAttributes` hook (set `target="_blank"` and `rel` on `a[href]`).
- `isomorphic-dompurify` 2.22.0 resolves `dompurify` 3.2.4. `eslint.config.mjs` has no rule against raw HTML.
- Server components render several of these (member, team and project profile server HTML, per the `profiles` spec), so sanitizing must work under Node, not only in the browser.

A cloud agent attempt on 2026-10-26 (branch `claude/LAB-2986-…`, not pushed) took the same shape and failed only on a leftover variable in `NewsDetailBody`. Its code review asked to keep tables, `color`/`background-color` and mention attributes in the default allowlist, and to memoize the sanitize step. This design includes all four.

## Goals / Non-Goals

**Goals:**

- One module owns DOMPurify: one import, one hook registration, named allowlists.
- One component and one parse helper are the only ways production code turns a string into DOM.
- Lint keeps it that way.

**Non-Goals:**

- Changing the allowlists that already exist (comment, forum post, AI app feedback, job description, SPV, PRD, team news). They move as they are.
- Server-side caching of sanitized output.
- Sanitizing on write in the frontend beyond what `feed.service` already does.

## Decisions

### 1. `sanitizeHtml(html, profile)` with named profiles in `utils/html/sanitizeHtml.ts`

One function, one `SANITIZE_PROFILES` record: `richText` (default), `comment`, `forumPost`, `aiAppFeedback`, `jobDescription`, `spv`, `prd`, `teamNews`, `searchHighlight`. The existing `sanitizeXxxHtml` exports stay as one-line wrappers (`sanitizeCommentHtml = (h) => sanitizeHtml(h, 'comment')`) so their tests and call sites keep working. The `*_SANITIZE_CONFIG` constants move to `utils/html/sanitizeProfiles.ts` (configs only, no DOMPurify import, so the wrappers can re-export them without a circular import) and are re-exported under their old names.

The hook is registered once, in this module only. `PrdContent`, `NewsDetailBody` and the four `sanitize*Html` files stop registering their own.

*Alternative:* keep one file per feature and add a lint rule only. Rejected: the hook would still be registered in N places, and a new feature would still copy a config.

### 2. `richText` allowlist

- Tags: `p br a strong b em i u s strike ul ol li h1–h6 blockquote code pre span hr div table thead tbody tfoot tr th td`.
- Attributes: `href target rel class style data-mention data-uid data-name data-external-id colspan rowspan`.
- URIs: `/^(?:https?:|mailto:|\/(?!\/))/i` (same as `comment`).
- `style`: an `uponSanitizeAttribute` hook on the `style` attribute, active only for profiles that set `styleProperties`. It parses the declaration list and keeps only the profile's properties, each checked against a value rule: a plain color for `color` / `background-color`, a keyword for `text-align` / `white-space`. Anything with `url(`, `expression(`, `var(`, escapes or strings fails its rule. `richText` sets `styleProperties: ['color', 'background-color', 'text-align', 'white-space']`. The other profiles keep forbidding `style`. On prod, 128 of 693 event descriptions use `white-space` and 99 use `text-align` (pasted content), and colors are used in 33 bios, 17 experience descriptions, 13 Gantry items and 10 team Abouts.
- `img` stays, with `src` limited to `https:` by an `imageSrc` profile rule checked in the `uponSanitizeAttribute` hook, plus `alt`, `width`, `height` and the float class. Every editor that writes these fields (`RichTextEditor`'s default toolbar, and Gantry's `IDEAS_EDITOR_TOOLBAR`) has an image button, and uploads land in `pl-directory-images-<env>` on S3. E2E on the PR preview showed a dev Gantry item losing its two images under an earlier no-`img` allowlist. Images from other `https:` hosts are allowed: a viewer's browser then fetches from that host, which reveals little more than a link would, and members can embed such images today. An image whose source fails the rule keeps no `src` and renders nothing.

**`methodology` profile.** `how_it_works_html` comes from the founder sourcing pipeline, not from members, and its flow diagrams are inline SVG in `<figure>` with an SVG `<style>` block (`.ms-*` classes), `id`s and `marker-end="url(#…)"` references. The profile is DOMPurify's HTML + SVG profiles, with form controls, `iframe`, `base`, `meta` and `link` forbidden, and the `richText` style filter. It keeps DOMPurify's default URI check, since a custom one would reject plain values like `x="440"`. Checked against the prod document: all tags, all 1,091 attributes and all five style blocks come through unchanged. The `<style>` block is global CSS. That is accepted because the pipeline writes this field.

`class` is allowed because Quill output depends on `ql-align-*`, `ql-indent-*` and mention classes. A borrowed class can change layout. It cannot run code.

*Alternative:* DOMPurify's default HTML profile (what five sites use today). Rejected: it allows `img`, `style` with any property, `form` elements and `svg`. That is a much larger surface than the ticket's "links, lists, bold".

### 3. `<SafeHtml html profile as className />` in `components/ui/SafeHtml`

It renders `createElement(as, { ...rest, ...useMemo(() => safeHtmlProps(html, profile), [html, profile]) })`, with `as` defaulting to `div`. It is not a client component (React's server build exports `useMemo`), so server components can use it; isomorphic-dompurify uses jsdom on the server.

`safeHtmlProps(html, profile)` in `utils/html/` returns `{ dangerouslySetInnerHTML: { __html: sanitizeHtml(html, profile) } }`, to spread on a native element. It exists for styled-jsx components: styled-jsx adds its scope class only to lowercase JSX elements, so a `className` passed to `<SafeHtml>` loses its scoped styles (checked in Jest: the `jsx-*` class lands on a native sibling, not on the SafeHtml element). The 13 styled-jsx render sites spread `safeHtmlProps` on their existing element. Every other site uses `SafeHtml`.

`QuillContent` keeps its linkify step and renders through `SafeHtml`. Its `sanitize` prop becomes `profile` (default `richText`). Sanitizing after linkify is already the documented order.

Clipping (`text-clipper`, `truncateHTML`, `collapseSpvAbout`) stays at the call sites. `SafeHtml` sanitizes the clipped string at render, so nothing has to be sanitized "before" anything else to be safe.

### 4. `parseSafeHtml(html, profile, options?)` for `html-react-parser`

It lives in `utils/html/parseSafeHtml.ts` and calls `parse(sanitizeHtml(html, profile), options)`. Forum post and comment bodies use `forumPost`. `forum/Posts` teasers use `forumPost`. Search highlights use `searchHighlight` (tags `em mark b strong`, no attributes). `FeedCommentContent` and `ForumPostModal` switch to it with no behavior change. The backend highlights matches with `<em>` (`search.service.ts`, `pre_tags`).

`processPostContent` puts an inline `style` on markdown images that `forumPost` strips, as it already did in `ForumPostModal`. `/forum`'s `Post` and `CommentItem` stylesheets get the same `img` rules (`max-width`, `height: auto`, `border-radius`, and `margin` on images without a float class).

### 5. Plain text stays text

`notification-card` renders `{text}` as a React child. Nothing in that string needs markup.

### 6. Lint

In `eslint.config.mjs`:

- `react/no-danger: 'error'` everywhere. `SafeHtml` and `safeHtmlProps` set the prop through `createElement` and an object, which the rule does not flag, so neither needs a disable.
- `no-restricted-imports` with `paths` for `dompurify`, `isomorphic-dompurify` and `html-react-parser`, each with a message that points to `SafeHtml` or `parseSafeHtml`. Turned off in `utils/html/**`.
- `prototypes/**` and `design-canvas/**` are added to the override that turns both rules off (mocked data, disabled in production; see `prototypes/README.md`).
- Inline `// eslint-disable-next-line react/no-danger -- <reason>` on: `app/jobs/openings/[uid]/page.tsx` and `app/spotlight/[slug]/page.tsx` (JSON-LD, serialized and `<`-escaped), and `components/page/changelog/changelog-list.tsx` (repo constant `ChangeLogList`).
- `__tests__/**` keeps direct imports allowed for `no-restricted-imports`, so tests can assert against the real sanitizer.

A Jest test runs the ESLint CLI on stdin (`--stdin-filename components/x/Fixture.tsx`) for a raw render and for each restricted import, and expects one error each. ESLint 9 loads the flat config through dynamic `import()`, which Jest's module VM cannot do in-process, so the test uses a child process. This keeps the rules from being removed silently.

### 7. Dependencies

`dompurify` `^3.4.17` becomes a direct dependency. `isomorphic-dompurify` stays at 2.22.0: its range `dompurify ^3.2.4` admits 3.4.17, so the lockfile dedupes to one copy.

*Alternative:* `isomorphic-dompurify` ^4.5.0 (`dompurify ^3.4.16`). Rejected: it pulls jsdom 30, whose ESM-only dependencies (`@exodus/bytes`) Jest 29 cannot load, so every node-environment suite that imports a sanitizer fails to start. Not npm `overrides` either: a direct dependency is visible in `package.json` and declares the floor.

## Risks / Trade-offs

- [A later `npm update` lets `isomorphic-dompurify` 2.x pull a second dompurify] → it cannot go below 3.4.17 while the direct dependency is there; the spec's lockfile scenario is checked in task 1.1.
- [Serialization changes in dompurify 3.4.x (attribute order, `<br />` → `<br>`) break exact-string tests] → seen in the agent run on `sanitizeForumPostHtml.test.ts`. Update the expectations. Rendered output is equivalent.
- [The richer default allowlist removes something members rely on (images in old bios, custom styles)] → task 4.1 counts such rows on dev before the switch. If the count is non-zero, the result goes on the ticket for a decision; the allowlist does not grow silently.
- [Sanitizing on every render of long lists (member cards)] → `useMemo` in `SafeHtml`. DOMPurify on a short bio costs well under 1 ms.
- [Global hook sets `target="_blank"` on root-relative links too] → existing behavior, kept on purpose (out of scope).
- [`style` hook bugs could let a property through] → unit tests cover `url(`, `expression(`, `var(`, `!important` with a banned property, uppercase property names, and comments inside the declaration.

## Migration Plan

Frontend-only and stateless. Ship through the normal `develop` → `main` flow. Rollback is a revert of the PR. No data changes.

## Open Questions

- Keeping `color` / `background-color` follows the agent review's recommendation. The ticket comment asked Vova to confirm it. If the answer is "drop colors", only `styleProperties` on `richText` and one spec scenario change.
