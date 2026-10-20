## Why

LAB-2919 (https://linear.app/protocollabs/issue/LAB-2919): the support Telegram channel shows the raw feedback screenshot without the member's drawings and text, because the drawings travel only as stroke data that LabOS replays. The channel also needs the page the member sent the feedback from.

## What Changes

- LabOS feedback from the feedback drawer: each screenshot with drawings is also sent as one picture with the drawings in it, next to the raw screenshot and its drawing data.
- A screenshot with no drawings is sent as today, with no extra upload.
- If the picture with the drawings cannot be made or uploaded, the feedback still sends with the raw screenshot.
- The feedback drawer and the help-menu support form send the page the member is on.

Out of scope: feedback on an AI app (it does not reach the support channel); image handling in the help-menu support form (it has no drawing tool); sending a Telegram photo (pl-notification-service).

## Capabilities

### New Capabilities
- `feedback`: feedback and support requests that members send from LabOS to the support team.

### Modified Capabilities

## Impact

The feedback drawer (LabOS feedback with screenshots) and the help-menu support form. The support Telegram channel shows the picture with the drawings and a link to the page.
