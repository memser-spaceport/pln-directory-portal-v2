# Login System Documentation

This document describes the authentication flow and architecture for the Protocol Labs Directory portal.

## Architecture Overview

```
+-------------------------------------------------------------------+
|                         app/layout.tsx                            |
|  +------------+  +--------------+  +----------------------------+ |
|  |  AuthBox   |  |BroadcastChan |  |      CookieChecker         | |
|  |(dynamic)   |  |(dynamic)     |  |      (dynamic)             | |
|  +------------+  +--------------+  +----------------------------+ |
+-------------------------------------------------------------------+
```

## Folder Structure

```
components/core/login/
├── AuthBox/              # Main auth wrapper with PrivyProvider
├── AuthInfo/             # Login initialization & loading UI
├── AuthInvalidUser/      # Error modal handler
├── BroadcastChannel/     # Cross-tab logout synchronization
├── CookieChecker/        # Session expiry detection
├── LinkAccountModal/     # Account linking assistance modal
├── PrivyModals/          # Main auth event handler
├── UserInfoChecker/      # User info sync component
├── VerifyEmailModal/     # Error modal UI
└── index.ts              # Barrel exports
```

## Login Flow

### Step 1: User Initiates Login

User clicks "Sign in" button, which navigates to `#login` hash.

**File:** `AuthBox.tsx`

```typescript
const isLoginPopup = hash === '#login';
// ...
{isLoginPopup && <AuthInfo />}
```

### Step 2: Login Initialization

`AuthInfo` component handles the initialization sequence.

**File:** `AuthInfo/AuthInfo.tsx`

1. Shows loading spinner overlay
2. Clears localStorage
3. Logs out any existing Privy session
4. Creates a `stateUid` via API call to `/v1/auth/state`
5. Stores `stateUid` in localStorage
6. Dispatches `privy-init-login` custom event

```typescript
localStorage.clear();
await logout();
const response = await createStateUid();
localStorage.setItem('stateUid', result);
document.dispatchEvent(new CustomEvent('privy-init-login'));
```

### Step 3: Privy Modal Opens

`PrivyModals` listens for the `privy-init-login` event and opens Privy's authentication modal.

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
function handleInitLogin() {
  const stateUid = localStorage.getItem('stateUid');
  const prefillEmail = localStorage.getItem('prefillEmail');

  if (stateUid) {
    login(prefillEmail ? { prefill: { type: 'email', value: prefillEmail } } : undefined);
  }
}
```

### Step 4: User Authenticates

User completes authentication via one of:
- Email (magic link)
- Google OAuth
- GitHub OAuth
- Wallet (SIWE)

### Step 5: Privy Login Success

After successful Privy authentication, the `AUTH_LOGIN_SUCCESS` event fires.

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
async function handleLoginSuccess(e: CustomEvent) {
  const { user: privyUser } = e.detail;

  // Require email linking if not present
  if (!privyUser?.email?.address) {
    setLinkAccountKey('email');
    return;
  }

  // Proceed to directory login
  await initDirectoryLogin();
}
```

### Step 6: Directory Token Exchange

Exchange Privy token for directory tokens.

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
const initDirectoryLogin = async () => {
  const privyToken = await getAccessToken();

  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exchangeRequestToken: privyToken,
      exchangeRequestId: localStorage.getItem('stateUid'),
      grantType: 'token_exchange',
    }),
  });

  // Handle response...
};
```

### Step 7: Save Tokens

On successful token exchange, tokens are saved to cookies.

**File:** `hooks/auth/useAuthTokens.ts`

```typescript
const saveTokens = (response: TokenResponse, user: User) => {
  Cookies.set('authToken', JSON.stringify(response.accessToken), { ... });
  Cookies.set('refreshToken', JSON.stringify(response.refreshToken), { ... });
  Cookies.set('userInfo', JSON.stringify(response.userInfo), { ... });
  Cookies.set('authLinkedAccounts', JSON.stringify(authLinkedAccounts), { ... });

  // Identify user in PostHog
  postHog.identify(response.userInfo.uid, { ... });
};
```

### Step 8: Complete Login

Show success toast and reload page.

```typescript
const loginUser = async (output) => {
  clearPrivyParams();
  showLoginSuccess();
  setTimeout(() => window.location.reload(), 500);
};
```

## Data Flow Diagram

```
User clicks "Sign in"
        |
        v
   URL --> #login
        |
        v
+------------------+
|     AuthBox      |  Detects #login, renders AuthInfo
+--------+---------+
         |
         v
+------------------+
|    AuthInfo      |  Creates stateUid, dispatches event
+--------+---------+
         |
         v  'privy-init-login' event
+------------------+
|   PrivyModals    |  Opens Privy modal
+--------+---------+
         |
         v  User authenticates
+------------------+
|      Privy       |  Returns user + token
+--------+---------+
         |
         v  AUTH_LOGIN_SUCCESS event
+------------------+
|   PrivyModals    |  Exchanges token with directory API
+--------+---------+
         |
         v
+------------------+
|  useAuthTokens   |  Saves cookies, identifies PostHog
+--------+---------+
         |
         v
   Page reload --> User logged in
```

## Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `AuthBox` | Wraps app in PrivyProvider, detects #login hash |
| `AuthInfo` | Login initialization, creates stateUid, shows loader |
| `PrivyModals` | Handles all Privy events, token exchange with directory API |
| `AuthInvalidUser` | Displays error modals for auth failures |
| `VerifyEmailModal` | UI for error modals (regular + access denied variants) |
| `LinkAccountModal` | Help modal for account linking issues |
| `useAuthTokens` | Cookie management, token saving, PostHog identification |
| `BroadcastChannel` | Syncs logout across browser tabs |
| `CookieChecker` | Detects expired sessions, prompts re-login |
| `UserInfoChecker` | Syncs user info changes |

## Error Handling

### Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `unexpected_error` | Server error (500/401) | "Unexpected error occurred" |
| `rejected_access_level` | Access denied (403) | "Access denied" with registration link |
| `linked_to_another_user` | Email already linked | Opens LinkAccountModal |
| `exited_link_flow` | User cancelled email linking | Cleans up and shows error |
| `invalid_credentials` | Invalid auth credentials | Cleans up and shows error |
| `email-changed` | Email mismatch detected | Prompts re-login |

### Error Flow

```typescript
// PrivyModals handles errors via 'auth-invalid-email' event
document.dispatchEvent(new CustomEvent('auth-invalid-email', { detail: errorCode }));

// AuthInvalidUser listens and shows appropriate modal
document.addEventListener('auth-invalid-email', handleInvalidEmail);
```

## Cookies Reference

| Cookie | Content | Expiry |
|--------|---------|--------|
| `authToken` | JWT access token | Token expiry |
| `refreshToken` | JWT refresh token | Token expiry |
| `userInfo` | User profile data | Token expiry |
| `authLinkedAccounts` | Linked OAuth providers | Token expiry |

## Custom Events

| Event | Dispatched By | Handled By |
|-------|---------------|------------|
| `privy-init-login` | AuthInfo | PrivyModals |
| `auth-invalid-email` | PrivyModals | AuthInvalidUser |
| `auth-link-account` | Settings page | PrivyModals |
| `init-privy-logout` | Logout button | PrivyModals |
| `directory-update-email` | PrivyModals | Settings page |
| `new-auth-accounts` | PrivyModals | Settings page |

## Related Files

- `hooks/auth/usePrivyWrapper.ts` - Privy SDK wrapper
- `hooks/auth/useAuthTokens.ts` - Token management
- `services/auth.service.ts` - Auth API calls
- `analytics/auth.analytics.ts` - Auth event tracking
- `utils/auth.utils.ts` - Token decoding utilities
