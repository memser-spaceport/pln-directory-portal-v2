/* Nothing links an agent session back to the Gantry item that spawned it — the
   create endpoint takes only a repository and a prompt, and has no idempotency
   key. Without a record of what we already started, Back-then-click-again opens
   a second session and a second PR against the same item.

   This remembers the mapping client-side so the button can offer "View session"
   instead. It is per-browser by design's absence, not by choice: a different
   device, a cleared cache, or a second admin all see a fresh button. A durable
   fix needs the session to carry its originating item on the backend. */
const STORAGE_KEY = 'gantry-agent-sessions';

type SessionMap = Record<string, string>;

function readMap(): SessionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as SessionMap) : {};
  } catch {
    // Private mode, quota, or a hand-edited value — treat as "nothing recorded".
    return {};
  }
}

export function getGantryAgentSessionId(itemUid: string): string | null {
  return readMap()[itemUid] ?? null;
}

/* Read through useSyncExternalStore rather than an effect, so the value is
   available without a second render and the server snapshot stays null —
   localStorage doesn't exist during SSR, and claiming otherwise would
   hydrate "View session" over a server-rendered "Build with AI". */
const listeners = new Set<() => void>();

export function subscribeGantryAgentSessions(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function rememberGantryAgentSession(itemUid: string, sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readMap(), [itemUid]: sessionId }));
  } catch {
    // Losing the guard only costs a duplicate session; never break the flow.
  }
  listeners.forEach((listener) => listener());
}
