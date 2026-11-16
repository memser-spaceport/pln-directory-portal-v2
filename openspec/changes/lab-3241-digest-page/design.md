## Context

- The design is the `digest-web` prototype (Polina, 2026-11-13, `prototypes/entries/digest-web`). It uses mock data and `?story=&feedback=` params, and its view switch is for the prototype only.
- The data and the choice API come from LAB-3263, specified in the backend change `lab-3241-digest-page-api`:
  - `POST v1/labos-digest/page` `{ token }` returns `{ frequency, sentAt, firstName, stories[], forumPosts[], forumUnavailable }`. Each story has `uid, position, isTopStory, title, summary, contentHtml, image, sourceUrl, sourceDomain, teamName, eventType, tags, choice`. Each post has `tid, title, author, role, avatar, contentHtml, url`.
  - Errors: 401 with `reason` (`expired` and others), and 503.
  - `POST v1/labos-digest/choices` `{ token, newsItemUid, choice: more|less|none }` returns `{ newsItemUid, choice, changed }`.
- Links from the email (LAB-3265) follow this contract: `/digest?t=<token>&utm_source=digest_email_<link_type>_link&link_type=<link_type>&position=<n>[&story=<uid>&choice=more|less][#story-<uid>|#post-<tid>]`. `link_type` is `story`, `read_more`, `more`, `less`, `view_in_browser` or `post`. The links carry no `target_email`.
- `stripLoginParamsFromEvent` already removes `loginToken` from every PostHog URL, for the same reason the digest token must go.
- The app has no dark theme. `toast` comes from `components/core/ToastContainer`.

## Goals / Non-Goals

**Goals:**
- A faithful port of the prototype, with real data.
- A choice from the email that is safe from link scanners.
- No token leaks to analytics, logs or the Referer header.

**Non-Goals:**
- Changing the email (LAB-3265).
- Muted tags on News preferences.
- Dark mode.
- Any change to Home or to the old `/home?news=` capture.

## Decisions

1. **Server-rendered data, client-side choice.**
   - `app/digest/page.tsx` is a Server Component. It reads `t` from `searchParams` and calls the page read with `fetch` (`cache: 'no-store'`, no auth header, the same as `JobUnsubscribeClient`'s service). It renders the stories in the HTML, so the browser's native `#story-` scroll works on the first paint.
   - `app/digest/loading.tsx` renders the skeleton.
   - The read changes nothing on the backend, so it is safe for scanners that render the page.
   - The choice from the URL is sent only in a client `useEffect`, guarded by a ref against React Strict Mode double runs. After the save, `router.replace` drops `story` and `choice`. The page writes the URL with `window.history.replaceState` only if it keeps Next's `__NA` state (see the replaceState trap).
   - Alternative: fetch everything on the client. The first paint would be empty, and the hash scroll would need its own handling. Rejected.

2. **The token is passed as a prop, not stored.** The client island gets the token from the server page and sends it in the body of the choice calls. It never goes to localStorage, cookies or React Query keys, and it never appears in an event.

3. **Leak control.**
   - Add `t` to the params list in `stripLoginParamsFromEvent`, renamed in spirit to "sensitive URL params", with a comment. It already runs on every event, `$pageview` included.
   - `metadata.referrer = 'no-referrer'` and `robots: { index: false, follow: false }` on the page.
   - "Read on <source>" uses `rel="noopener noreferrer"`.

4. **Port, don't redesign.** Copy the prototype's markup and SCSS into `components/page/digest/` (`DigestPage`, `DigestStoryCard`, `DigestForumPost`, `DigestFeedbackButtons`, `DigestReceipt`), one component per file. Take its thumb icons and the top-story background from its `assets/` into `public/images/digest/` (or import them as static assets).
   - Drop the view switch, the mock intro and "Change topics".
   - Replace the greeting with the header from the proposal.
   - Story and post HTML renders through `SafeHtml` with the `richText` profile.

5. **Choice state.** The `useDigestChoice` mutation (React Query) does an optimistic press, rolls back on error with `toast.error`, and on success sets the receipt position: `top` for the email landing, `under` for a press on the page.
   - A press on the active button sends `none`.
   - Switching More to Less sends `less`; the backend replaces the choice.

6. **Analytics.** `analytics/digest.analytics.ts` with `ON_DIGEST_*` constants. The email click reuses the existing digest email click events, with a new `link_type`, so the current dashboards keep counting digest clicks. `from` on `digest-page-viewed` is derived from `link_type` and `choice`.

## Risks / Trade-offs

- [The token is in the page HTML and the address bar] → It is the member's own link. It is stripped from analytics, and the Referer is off. A forwarded email acts for its owner, as decided on LAB-3241.
- [A reload before the save finishes saves twice] → The backend is idempotent per story and choice.
- [Full `contentHtml` can be long on mobile] → This matches the prototype ("every story in full"). Polina reviews it on the env.
- [The prototype's colours and sizes are transcribed from Figma, with token fallbacks] → Keep the fallbacks; the DS tokens don't load (see the token-fallback trap).

## Migration Plan

No flag. The page goes live with the code, but no one can reach it until LAB-3265's template uses the new links. Rollback is a revert of the page.

## Open Questions

None for the frontend. The design gaps (header, loading, expired) are settled here, and Polina reviews them in test.
