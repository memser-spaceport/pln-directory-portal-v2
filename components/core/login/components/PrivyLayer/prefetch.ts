/**
 * Starts loading the Privy layer before it is needed (LAB-3092): called when a pointer or focus reaches Sign in, so the
 * sign-in dialog does not wait for a cold download. Nothing calls it at idle, which would bring Privy back into every
 * page view. A tiny module of its own, so the controls that call it don't pull in the auth shell.
 */
let started = false;

export function prefetchPrivyLayer(): void {
  if (started) return;
  started = true;
  void import('./PrivyLayer');
}
