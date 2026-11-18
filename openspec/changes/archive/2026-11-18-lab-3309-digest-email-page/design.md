## Context

`/digest?t=` reads on the server (`getDigestPage`) and saves More / Less from the client (`saveDigestChoice`), both straight to the public `v1/labos-digest/*` API with no auth header. `utils/stripLoginParamsFromEvent.ts` removes `t` from every PostHog URL. The suggested candidates unsubscribe page (`components/page/email-preferences/components/SuggestedCandidatesUnsubscribe`) is the house layout for a signed-out email page.

## Decisions

- **Server read, client change.** Same split as `/digest`: `app/digest/email/page.tsx` reads, a client component holds the state and calls the change.
- **No action on load.** The footer's `link_type` only picks the main button. The suggested candidates page unsubscribes on load; that is not repeated here because mail scanners open links.
- **Undo holds the previous settings in the component** and sends them back; the backend keeps no history.
- **Layout:** one centered card in the suggested candidates page layout, the digest page's type and buttons. Polina reviews it on the feature env.
- **Error states** mirror `DigestErrorState`, with `/settings/email` instead of Home.

## Risks

- Readers whose link is past 90 days still need sign-in; the expired message leads them there.
