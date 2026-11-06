# Proposal

## Why

[LAB-3092](https://linear.app/protocollabs/issue/LAB-3092), part of Goal [LAB-3083](https://linear.app/protocollabs/issue/LAB-3083) (SEO round 3).

Mobile pages are slow for the visitors search engines measure: signed-out ones. Lighthouse mobile, 2026-11-02:

| Page          | JS transferred | Total Blocking Time | LCP    |
| ------------- | -------------- | ------------------- | ------ |
| `/home`       | 3.3 MB         | 1,470 ms            | 1.8 s  |
| `/jobs`       | 3.1 MB         | 1,220 ms            | 12.3 s |
| A member page | —              | 660 ms              | 15.6 s |

Every visitor loads the login SDK (Privy), signed in or not:

- the SDK itself, a 640 KB chunk (2.1 MB unzipped);
- about 990 KB from `auth.privy.io`.

That is roughly half of what a page loads, and nobody uses it until they choose Sign in.

On `/jobs`, Lighthouse's own breakdown measures the LCP element (the signed-out headline, already in the server HTML) at about 1.9 s. The 12.3 s comes from the simulated slow phone, where painting waits behind the main-thread JavaScript. So the cure there is less JavaScript, not a different headline.

On a member page, the LCP element is a background image in CSS, which the browser finds late: 1.2 s of its time is spent before the request even starts.

## What Changes

- **Privy loads only when it is needed.**
  - For a signed-out visitor, nothing from Privy loads until they start to sign in: the `#login` hash, a Sign in click, or anything else that asks the login system for Privy (account linking, sign-out).
  - Signed-in members load it as today.
  - Sign-in, sign-out, account linking, login links (`?loginToken=`), cross-tab sign-out and the sign-in error dialogs all keep working.
- **`/jobs`:** no change to the headline, which is already server-rendered. Its LCP improves through the JavaScript cut above. Implementation confirms that the headline text does not change after hydration, which would restart LCP.
- **Member pages:** the image behind the contact-details panel is discovered from the HTML (preloaded, or an image element with high fetch priority), not from CSS.
- **`/home` images:** images below the fold load lazily, and every image has width and height, so nothing shifts while they load.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: the sign-in system (Privy) is loaded only when a visitor starts to sign in, or is already signed in. Every existing sign-in, sign-out and session flow keeps working.
- `runtime-platform`: images on `/home` load lazily below the fold and declare their size, and a member profile's largest image is discoverable from the HTML. The mobile performance budget (Total Blocking Time and LCP targets) moved to the follow-up [LAB-3100](https://linear.app/protocollabs/issue/LAB-3100), because this change does not meet it on its own (see design.md, Risks).

## Impact

- **Code:** `components/core/login` (AuthBox split into an always-present shell and a lazily loaded Privy layer, plus the event replay), `app/layout.tsx`, the member contact-details panel, and image tags on `/home`.
- **Dependencies:** no package changes. The Privy SDK stays at its current version.
- **Testing:** sign-in flows need the feature env and Roma: email, Google, GitHub, wallet, login link, sign-out, account linking, cross-tab sign-out, and an expired session. UI is meant to look unchanged, so Polina only needs a glance.

### Out of scope

- A Content-Security-Policy.
- Upgrading or replacing Privy.
- Changes to the auth service or the API.
- PostHog's bundle (179 KB) and React itself.
- Pages other than `/home`, `/jobs` and member pages.
