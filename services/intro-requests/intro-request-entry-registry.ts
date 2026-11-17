/**
 * Shared state for every mounted "Request an intro" control on a page.
 *
 * A page can mount the same control more than once (the team page renders a
 * desktop copy and a mobile copy and hides one with CSS). The copies for one
 * target share this state, so:
 * - `intro-request-button-shown` fires once a page view for each target and entry point;
 * - a send in one copy shows "Intro requested" in every copy.
 *
 * A target's state lives while at least one control for it is mounted. When the
 * last one unmounts (the member leaves the page), the state is dropped, so the
 * next page view starts fresh.
 */

interface TargetState {
  mounted: number;
  sent: boolean;
  shownEntryPoints: Set<string>;
}

type Listener = () => void;

const targets = new Map<string, TargetState>();
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function introRequestTargetKey(type: string, targetId: string): string {
  return `${type}:${targetId}`;
}

export function subscribeIntroRequestTargets(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Register a mounted control. Returns the release function for unmount. */
export function retainIntroRequestTarget(key: string): () => void {
  const state = targets.get(key) ?? { mounted: 0, sent: false, shownEntryPoints: new Set<string>() };
  state.mounted += 1;
  targets.set(key, state);
  return () => {
    state.mounted -= 1;
    if (state.mounted <= 0 && targets.get(key) === state) {
      targets.delete(key);
    }
  };
}

/** True only for the first claim of an entry point for a target while it stays mounted. */
export function claimIntroRequestShown(key: string, entryPoint: string): boolean {
  const state = targets.get(key);
  if (!state || state.shownEntryPoints.has(entryPoint)) return false;
  state.shownEntryPoints.add(entryPoint);
  return true;
}

export function isIntroRequestSent(key: string): boolean {
  return targets.get(key)?.sent ?? false;
}

export function markIntroRequestSent(key: string): void {
  const state = targets.get(key);
  if (!state || state.sent) return;
  state.sent = true;
  emit();
}
