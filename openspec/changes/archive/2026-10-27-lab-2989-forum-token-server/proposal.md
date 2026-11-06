## Why

LAB-2989 (https://linear.app/protocollabs/issue/LAB-2989): the forum bearer token is in the browser bundle, and the browser chooses the impersonation header.

## What Changes

- Forum reads and posts go through `/api/forum/nodebb`.
- The forum token is read only on the server.
- The server sends `x-impersonate-member-uid` only when the session user is a directory admin.

## Capabilities

### New Capabilities

- `forum`: the forum token stays on the server, and impersonation is decided from the server session.

### Modified Capabilities

## Impact

- Forum pages, forum hooks, and home-feed forum posts, votes, and replies.
