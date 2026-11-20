## Why

The digest email v2 (LAB-3290) adds "Post your team news →" and "Change topics" links to the digest page. The page already opens the Post news modal for `postnews=open` and the topics modal for `topics=open`, but it ignored the two new `link_type` values, so their clicks were not counted.

## What Changes

- The page knows the `post_news` and `change_topics` link types: it records the email click with them, and `digest-page-viewed` gets `from` `email-post-news` or `email-change-topics`.
- New email assets `public/images/email/email-icon-megaphone@2x.png` and its dark-mode version, for the email's team news card.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: Digest page events.

## Impact

`analytics/digest.analytics.ts`, `public/images/email/`.
