/**
 * Google and GitHub sign-in leave the site and come back with these in the address. Privy completes the sign-in from
 * them when it loads, and removes them once it has.
 */
const PRIVY_OAUTH_RETURN = /[?&]privy_oauth_(code|state|provider)=/;

/**
 * Whether the page was opened by a Google or GitHub sign-in coming back, so a sign-in is finishing.
 *
 * A page that sends a signed-out visitor to `#login` on load must check this first. Starting a sign-in clears
 * localStorage and signs Privy out (`AuthInfo`), which throws away the one that is finishing: the visitor lands back
 * on the sign-in dialog and is never signed in (LAB-3308).
 */
export const isPrivyOAuthReturn = (search = typeof window === 'undefined' ? '' : window.location.search) =>
  PRIVY_OAUTH_RETURN.test(search);
