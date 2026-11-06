## Why

LAB-3175 asks the Request Intro form to tell the member what to write, and puts the button beside Follow on a team page. On a phone the button is full width.

## What Changes

- The field label is "What do you need help with?", with an example placeholder and help text under the field.
- Send stays disabled until the trimmed text has 20 characters. From 1 to 19 characters, the form asks for more detail.
- On a team page, Request intro sits to the left of Follow from 640px up. Below 640px, Request intro and Follow are both full width, with Request intro above Follow.
- On a member page, Request intro stays in the header and is full width below 640px.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `intro-requests`: the form copy and the minimum length change, and the button position is specified.

## Impact

- Request Intro form on member and team profiles.
- Team profile header: Request intro moves into the Follow row.
- The API, the Telegram post, `ask-submitted`, and the receipt do not change.
