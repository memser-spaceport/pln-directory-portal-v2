## Why

A member who stays signed in for a few hours sees the IRL Gatherings error view. The signed-in guest and preferences calls fail, and the page treats that failure as a full error. The browser shows no failed request.

## What Changes

- A failed signed-in guest call falls back to the public guest list.
- A failed preferences call no longer replaces the page.
- A follower with no name, a missing permission list, or a non-list of events no longer throws.

## Capabilities

### New Capabilities

- `irl-gatherings`: the gatherings page stays up when a signed-in call fails and the public list loads.

### Modified Capabilities

## Impact

- `app/events/irl/page.tsx`
- `utils/irl.utils.ts`
- `utils/user/isAdminUser.ts`
