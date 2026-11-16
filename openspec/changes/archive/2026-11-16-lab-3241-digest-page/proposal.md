## Why

LAB-3264, the frontend part of Goal LAB-3241. In the digest email, "Read more" opens one story in a modal on Home, and readers expect the story to expand. Members also have no easy way to tune their digest. This change adds a LabOS page that shows one member's whole digest, opens from the email without sign-in, and has "More like this" and "Less like this" on each story. Design: LAB-3242, the `digest-web` prototype (`prototypes/entries/digest-web`).

## What Changes

- A new public page `/digest?t=<link token>`, built from the `digest-web` prototype for desktop and mobile, inside the LabOS top bar and bottom bar. It needs no sign-in and has no feature flag. The link token comes from the email (LAB-3265).
- The page shows every story of the digest in full, in email order, with "Read on <source>". Then it shows the digest's forum posts in full, with "Reply in the forum". It has no story modal.
- `#story-<uid>` or `#post-<tid>` scrolls to that item, with no mark on it.
- `&choice=more|less&story=<uid>` from the email's More or Less link saves that choice once, after the page loads in the browser. The page then shows the button as pressed and the confirmation at the top of the card.
- More and Less are buttons on each news card. After a press, the confirmation shows under the buttons. Undo, or a second press on the active button, reverts the choice and shows a toast.
- Our own design for the states the prototype doesn't cover: a "Your daily digest" or "Your weekly digest" header with the date, a loading skeleton, and an expired or invalid link state that links to Home.
- PostHog: the email click, with its link type and position, and the new events `digest-page-viewed`, `digest-story-read`, `digest-more-clicked`, `digest-less-clicked` and `digest-undo-clicked`. The link token is removed from every captured URL.
- The page is `noindex`.

## Capabilities

### New Capabilities
- `digest`: the digest reading page, its More / Less / Undo flow, its states and its events.

### Modified Capabilities
None. Old digest emails still link to `/home?news=…`, and the Home capture of those clicks stays as it is.

## Impact

- **New code:** `app/digest/` (page), `components/page/digest/` (page and cards, ported from the prototype), `services/digest/` (service, React Query hooks, query keys), `analytics/digest.analytics.ts`, and `ON_DIGEST_*` constants in `utils/constants.ts`.
- **Changed code:** `utils/stripLoginParamsFromEvent.ts` also removes the digest token parameter from captured URLs.
- **API:** `POST v1/labos-digest/page` and `POST v1/labos-digest/choices` from LAB-3263 (backend change `lab-3241-digest-page-api`).
- **Out of scope:** the email template and links (LAB-3265), muted tags on the News preferences page, dark mode (the app has none), and changes to Home.
