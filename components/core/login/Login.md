# Login System Documentation

This document describes the authentication flow and architecture for the Protocol Labs Directory portal.

## Architecture Overview

```
+-------------------------------------------------------------------+
|                         app/layout.tsx                            |
|  +------------+  +--------------+  +----------------------------+ |
|  |  AuthBox   |  |BroadcastChan |  |      CookieChecker         | |
|  |(dynamic)   |  |(dynamic)     |  |      (dynamic)             | |
+-------------------------------------------------------------------+
```

## Folder Structure

```
components/core/login/
├── components/           # Auth UI components
│   ├── AuthBox/          # Main auth wrapper with PrivyProvider
│   ├── AuthInfo/         # Login initialization & loading UI
│   ├── AuthInvalidUser/  # Error modal handler
│   ├── BroadcastChannel/ # Cross-tab logout synchronization (with fallback)
│   ├── CookieChecker/    # Session expiry detection
│   ├── LinkAccountModal/ # Account linking assistance modal
│   ├── PrivyModals/      # Main auth event handler
│   ├── UserInfoChecker/  # User info sync component
│   └── VerifyEmailModal/ # Error modal UI
├── hooks/                # Auth-related React hooks
│   ├── useAuthTokens.ts  # Token/cookie management hook
│   ├── usePrivyWrapper.ts # Privy SDK wrapper hook
│   └── index.ts          # Barrel exports
├── utils/                # Auth utilities (non-hooks)
│   ├── authEvents.ts     # Typed event emitter for auth events
│   ├── authStatus.ts     # Auth status utilities
│   └── index.ts          # Barrel exports
├── Login.md              # This documentation file
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
6. Emits `auth:init-login` typed event

```typescript
localStorage.clear();
await logout();
const response = await createStateUid();
localStorage.setItem('stateUid', result);
authEvents.emit('auth:init-login');
```

### Step 3: Privy Modal Opens

`PrivyModals` listens for the `auth:init-login` event and opens Privy's authentication modal.

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
function handleInitLogin() {
  const stateUid = localStorage.getItem('stateUid');
  const prefillEmail = localStorage.getItem('prefillEmail');

  if (stateUid) {
    login(prefillEmail ? { prefill: { type: 'email', value: prefillEmail } } : undefined);
  }
}

// Register listener
authEvents.on('auth:init-login', handleInitLogin);
```

### Step 4: User Authenticates

User completes authentication via one of:
- Email (magic link)
- Google OAuth
- GitHub OAuth
- Wallet (SIWE)

### Step 5: Privy Login Success

After successful Privy authentication, the `usePrivyWrapper` hook emits `auth:login-success`.

**File:** `hooks/auth/usePrivyWrapper.ts`

```typescript
const { login } = useLogin({
  onComplete: (user) => {
    authEvents.emit('auth:login-success', { user });
  },
  onError: (error) => {
    authEvents.emit('auth:login-error', { error });
  },
});
```

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
async function handleLoginSuccess(data: { user: any }) {
  const privyUser = data.user;

  // Require email linking if not present
  if (!privyUser?.email?.address) {
    setLinkAccountKey('email');
    return;
  }

  // Proceed to directory login
  await initDirectoryLogin();
}

// Register listener
authEvents.on('auth:login-success', handleLoginSuccess);
```

### Step 6: Directory Token Exchange

Exchange Privy token for directory tokens with retry support.

**File:** `services/auth.service.ts`

```typescript
export const exchangeToken = async (
  privyToken: string,
  stateUid: string,
  retries = 3
): Promise<TokenExchangeResult> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(`${DIRECTORY_API_URL}/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchangeRequestToken: privyToken,
        exchangeRequestId: stateUid,
        grantType: 'token_exchange',
      }),
    });
    // Retry on 5xx, return immediately on 4xx
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      return { ok: response.ok, data: response.ok ? await response.json() : null, status: response.status };
    }
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
  }
  return { ok: false, data: null, status: 500 };
};
```

**File:** `PrivyModals/PrivyModals.tsx`

```typescript
const initDirectoryLogin = async () => {
  const privyToken = await getAccessToken();
  const stateUid = localStorage.getItem('stateUid') || '';

  const response = await exchangeToken(privyToken, stateUid);

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
  router.refresh();
  setTimeout(() => window.location.reload(), 300);
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
|    AuthInfo      |  Creates stateUid, emits auth:init-login
+--------+---------+
         |
         v  authEvents.emit('auth:init-login')
+------------------+
|   PrivyModals    |  Opens Privy modal
+--------+---------+
         |
         v  User authenticates
+------------------+
|      Privy       |  Returns user + token
+--------+---------+
         |
         v  authEvents.emit('auth:login-success')
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
| `PrivyModals` | Handles all auth events, token exchange with directory API |
| `AuthInvalidUser` | Displays error modals for auth failures |
| `VerifyEmailModal` | UI for error modals (regular + access denied variants) |
| `LinkAccountModal` | Help modal for account linking issues |
| `useAuthTokens` | Cookie management, token saving, PostHog identification |
| `usePrivyWrapper` | Wraps Privy hooks, emits typed auth events |
| `BroadcastChannel` | Syncs logout across browser tabs (with localStorage fallback) |
| `CookieChecker` | Detects expired sessions, prompts re-login |
| `UserInfoChecker` | Syncs user info changes |

## Typed Event System

The auth system uses a typed event emitter (`authEvents`) for type-safe event handling.

**File:** `hooks/auth/authEvents.ts`

```typescript
export interface AuthEventMap {
  'auth:init-login': void;
  'auth:login-success': { user: any };
  'auth:login-error': { error: string };
  'auth:link-success': { user: any; linkMethod: string; linkedAccount: any };
  'auth:link-error': { error: string };
  'auth:invalid-email': AuthErrorCode;
  'auth:link-account': LinkMethod;
  'auth:logout': void;
  'auth:logout-success': void;
  'auth:update-email': { newEmail: string };
  'auth:new-accounts': string;
}

// Usage - Emitting events
authEvents.emit('auth:login-success', { user });
authEvents.emit('auth:logout');

// Usage - Listening to events
const unsubscribe = authEvents.on('auth:login-success', (data) => {
  console.log(data.user); // Typed!
});
// Cleanup
unsubscribe();
```

## Auth Status Utilities

**File:** `hooks/auth/authStatus.ts`

```typescript
export const authStatus = {
  isLoggedIn: () => Boolean(Cookies.get('userInfo') || Cookies.get('authToken')),
  getUserInfo: (): IUserInfo | null => { ... },
};

// Usage in event handlers (non-React context)
const isLoggedIn = authStatus.isLoggedIn();
```

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
// PrivyModals emits error via typed event
authEvents.emit('auth:invalid-email', 'unexpected_error');

// AuthInvalidUser listens
authEvents.on('auth:invalid-email', (errorCode) => {
  showErrorModal(errorCode);
});
```

## Cookies Reference

| Cookie | Content | Expiry |
|--------|---------|--------|
| `authToken` | JWT access token | Token expiry |
| `refreshToken` | JWT refresh token | Token expiry |
| `userInfo` | User profile data | Token expiry |
| `authLinkedAccounts` | Linked OAuth providers | Token expiry |

## Typed Auth Events

| Event | Payload | Emitted By | Handled By |
|-------|---------|------------|------------|
| `auth:init-login` | `void` | AuthInfo | PrivyModals |
| `auth:login-success` | `{ user }` | usePrivyWrapper | PrivyModals |
| `auth:login-error` | `{ error }` | usePrivyWrapper | PrivyModals |
| `auth:link-success` | `{ user, linkMethod, linkedAccount }` | usePrivyWrapper | PrivyModals |
| `auth:link-error` | `{ error }` | usePrivyWrapper | PrivyModals |
| `auth:invalid-email` | `AuthErrorCode` | PrivyModals | AuthInvalidUser |
| `auth:link-account` | `LinkMethod` | Settings pages | PrivyModals |
| `auth:logout` | `void` | Logout buttons | PrivyModals |
| `auth:logout-success` | `void` | usePrivyWrapper | PrivyModals |
| `auth:update-email` | `{ newEmail }` | PrivyModals | Settings pages |
| `auth:new-accounts` | `string` | PrivyModals | Settings pages |

## BroadcastChannel with Fallback

**File:** `BroadcastChannel/BroadcastChannel.tsx`

The BroadcastChannel component syncs logout across browser tabs. It includes a localStorage fallback for browsers without BroadcastChannel support.

```typescript
// Helper function for broadcasting logout
export const broadcastLogout = () => {
  const channel = createLogoutChannel();
  if (channel) {
    channel.postMessage('logout');
    if (channel instanceof BroadcastChannel) {
      channel.close();
    }
  }
};

// Fallback for unsupported browsers
class LocalStorageFallback {
  postMessage(message: string) {
    localStorage.setItem(this.key, message);
    localStorage.removeItem(this.key); // Triggers storage event
  }
}
```

## Related Files

- `components/core/login/hooks/usePrivyWrapper.ts` - Privy SDK wrapper, emits auth events
- `components/core/login/hooks/useAuthTokens.ts` - Token management
- `components/core/login/utils/authEvents.ts` - Typed event emitter
- `components/core/login/utils/authStatus.ts` - Auth status utilities
- `services/auth.service.ts` - Auth API calls (with retry support)
- `analytics/auth.analytics.ts` - Auth event tracking
- `utils/auth.utils.ts` - Token decoding utilities
