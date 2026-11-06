/**
 * Whether this page needs the sign-in system (Privy) loaded (LAB-3092).
 *
 * Privy's SDK is the largest script on every page, and a signed-out visitor needs it only once they start to sign in.
 * This store records that the page asked for it: a sign-in, an account link or a sign-out reached the auth event bus
 * with nothing loaded to handle it. Once requested it stays requested for the life of the page, so a dismissed or failed
 * sign-in never unloads Privy mid-flow. No Privy import here: the always-present auth shell reads this store.
 */
type Listener = () => void;

let requested = false;
const listeners = new Set<Listener>();

export const privyDemand = {
  isRequested: (): boolean => requested,
  request(): void {
    if (requested) return;
    requested = true;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Tests only. */
  reset(): void {
    requested = false;
  },
};
