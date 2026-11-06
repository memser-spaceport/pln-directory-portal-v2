# Proposal

## Why

[LAB-2986](https://linear.app/protocollabs/issue/LAB-2986) (wave 2, High, from the security spike [LAB-2977](https://linear.app/protocollabs/issue/LAB-2977)): the frontend puts member-written and AI-generated HTML on the page in about 40 places, and each place decides on its own whether to sanitize. Many do not. Member bios, team "About", project descriptions, team asks, IRL event and demo day descriptions, experience descriptions, founder methodology, deal and Gantry descriptions, guide comments and NodeBB forum bodies reach the DOM raw. One office-hours notification builds HTML from a member's name. The app ships no CSP, so a script tag or an event handler in any of these fields runs in every viewer's session. The backend now sanitizes member HTML on write (LAB-2987), but old rows, other writers (Forest Admin, NodeBB, enrichment, ingest) and future fields still need a safe read path.

## What Changes

- One sanitizer entry point with named allowlists. Every render of member- or AI-written HTML goes through it. The existing per-feature configs (comments, forum posts, AI app feedback, job descriptions, SPV, PRD, team news) become named allowlists in the same module, with their current behavior kept.
- A new default rich-text allowlist for profile and listing content: paragraphs, line breaks, links, bold/italic/underline/strike, lists, headings, blockquote, code, horizontal rule, tables, and Quill classes. Inline `style` keeps only `color` and `background-color`. Links keep `http(s):`, `mailto:` and root-relative URLs, and open in a new tab with `rel="noopener noreferrer"`.
- One component renders sanitized HTML. All raw HTML renders on production routes move to it, including the `html-react-parser` sites (forum posts and comments, search result highlights).
- Text that never needed to be HTML (the office-hours notification title) renders as plain text.
- Lint: `react/no-danger` is an error outside the safe-render component. Direct imports of `dompurify`, `isomorphic-dompurify` and `html-react-parser` are errors outside the sanitizer module. Exceptions carry a disable comment with a reason: the two JSON-LD `<script>` tags, the repo-authored changelog, and the design-canvas module constant.
- Dependencies: `dompurify` becomes a direct dependency at ^3.4.17. `isomorphic-dompurify` stays at 2.22.0 and dedupes to the same copy. The lockfile resolves a single dompurify ≥ 3.4.17.

## Capabilities

### New Capabilities

- `html-content-safety`: how the frontend shows HTML that members wrote or AI generated: what formatting survives, what is removed, how links behave, and that no other render path exists.

### Modified Capabilities

None. `profiles` covers server HTML content and privacy. Its requirements still hold: bio, about and description text stay in the server HTML, sanitized.

## Out of scope

- Backend write-side sanitization (done in LAB-2987, pln-directory-portal).
- A Content-Security-Policy header (a separate spike item).
- Spotlight JSON-LD escaping (LAB-2980). The two JSON-LD sites only get a lint exception here.
- `/prototypes` and `/design-canvas` entries. They use mocked data and are off in production. Lint ignores `prototypes/`.
- Markdown renders (`react-markdown` without `rehype-raw` already escapes embedded HTML).
- Changing which links open in a new tab. The existing global hook stays as it is.
- Rewriting stored member data.

## Impact

- Repo: `pln-directory-portal-v2` only.
- Code: `utils/html/` (sanitizer module and allowlists), a new `components/ui/SafeHtml`, `components/ui/QuillContent`, and about 35 components under `components/` and `app/` (full list in tasks.md), plus `eslint.config.mjs`.
- Dependencies: a direct `dompurify` dependency. The lockfile moves dompurify from 3.2.4 to 3.4.17.
- Visible behavior: scripts, event handlers, iframes, forms, `javascript:` links and non-color inline styles disappear from member and AI content. Allowed formatting renders as before. Some content that renders raw today (for example, embedded images in bios) may lose tags the allowlist does not cover. The task list checks real dev data for this.
- Docs: AGENTS.md and CLAUDE.md get one rule: render HTML only through the safe-render component.
