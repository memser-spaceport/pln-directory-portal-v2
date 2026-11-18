## Why

The digest page v2 design (LAB-3287, Polina's `prototypes/entries/digest-web`) lets a reader change their topics without leaving the digest: an "Add topics" card in the side column and a topics modal (LAB-3289).

## What Changes

- "Add topics" card: suggested topics as News preferences chips, three rows, Save topics, See all topics.
- Topics modal: search, all tags in News preferences' themes, Save / Cancel. Opened from the card, from "Change topics" after the intro line, and from a `topics=open` link.
- Saves the signed-in member's News preferences tags with the existing save; signed-out readers go to sign-in and come back to what they pressed.
- Three new events.
- Reads the backend's new page field `topics` (BE LAB-3289); defaults to empty when missing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: topics card, topics modal, saving topics, topics events.

## Impact

- `components/page/digest/*` (new `DigestTopicsCard`, `DigestTopicsModal`), `services/digest/*` (new `useDigestTopics`), `analytics/digest.analytics.ts`, `utils/constants.ts`.
