# Proposal

## Why

[LAB-2930](https://linear.app/protocollabs/issue/LAB-2930), part of Goal [LAB-2876](https://linear.app/protocollabs/issue/LAB-2876): Search Console lists `/demoday/plf25/completed`, `/demoday/plw26/completed` and `/demoday/partner26-1/completed` as copies of each other ("duplicate without user-selected canonical"). On `os.pl.xyz` (checked 2026-10-26), the server HTML of every public Demo Day page is the same loading skeleton under the navbar, about 120 characters of text and no `<h1>`. LAB-2924 already made these pages indexable with their own canonical; this change gives them content. An unknown Demo Day id also answers HTTP 200 with that skeleton, indexable under its own canonical (a soft 404).

## What Changes

- The server HTML of a completed Demo Day carries its name, description and participating teams with links to their profiles.
- The server HTML of a Demo Day's landing page carries its name, description and date.
- A Demo Day id the API reports as not found answers HTTP 404 on both pages. Any other API failure keeps today's behaviour.
- The countdown on the landing page renders in the browser only, as before in practice.
- No visible change for a signed-in user beyond the page appearing sooner.
