## Why

The digest page v2 (LAB-3291, item 12 of LAB-3287) lists other press about network teams after the stories, as in the digest-web prototype's DigestNetworkNews.

## What Changes

- New section "More from the network" from the page read's new `networkNews` field; hidden when empty. A backend without the field reads as empty.
- New event `digest-network-news-clicked`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: More from the network; Digest page events.

## Impact

`components/page/digest/DigestNetworkNews.tsx`, `DigestPage.tsx`, `services/digest/*`, `analytics/digest.analytics.ts`, `utils/constants.ts`.
