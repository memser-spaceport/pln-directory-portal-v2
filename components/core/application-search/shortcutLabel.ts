/**
 * The search shortcut's platform-dependent label, as a `useSyncExternalStore`
 * triple.
 *
 * The shortcut is Ctrl+K on Windows and Linux, so naming it ⌘K everywhere would
 * be wrong for most people — but the platform is only knowable on the client,
 * and the button is server-rendered.
 *
 * A lazy `useState` initializer does not solve that, though it looks like it
 * should: the initializer runs during SSR too, where `navigator` is undefined,
 * so the server committed "Ctrl+K" and a Mac client hydrated with "⌘K" — a
 * guaranteed mismatch on exactly the machines the ⌘ is for, and one React
 * refuses to patch up ("this won't be patched up"), leaving those users with
 * the wrong label anyway.
 *
 * `useSyncExternalStore` is the sanctioned answer: `getServerShortcutLabel` is
 * the server snapshot, so SSR and the first client render agree, and React then
 * re-renders with the real value as an ordinary update.
 *
 * A leaf module so a test can bind to the shipped functions without dragging in
 * `ApplicationSearch`'s graph (Privy, PostHog, the search dialog). Module scope
 * also keeps the three callbacks referentially stable, which is what stops the
 * subscription being torn down on every render.
 */
export const subscribeToNothing = () => () => {};

export const getShortcutLabel = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘K' : 'Ctrl+K';

export const getServerShortcutLabel = () => 'Ctrl+K';
