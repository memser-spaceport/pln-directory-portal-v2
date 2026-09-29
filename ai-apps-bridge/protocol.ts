/**
 * The wire contract between LabOS and the bridge script running inside an
 * embedded AI App. Imported by BOTH sides: `bridge.ts` (bundled into
 * `public/ai-apps/bridge/v1.js` and loaded by apps) and the LabOS feedback UI.
 *
 * Nothing in here may import from the app tree — it ships inside every app.
 *
 * Adding a feature = adding a named message type and advertising it in
 * `capabilities`. There is deliberately no generic "run this" or "read that"
 * message: the bridge is a fixed menu, not a remote control.
 */

export const BRIDGE_NS = 'pln-bridge';
export const BRIDGE_VERSION = 1;

export type BridgeCapability = 'pick' | 'describe' | 'crop';

/** A rectangle in the app's viewport (CSS px). LabOS offsets it by the iframe's own rect. */
export type BridgeRect = { x: number; y: number; w: number; h: number };

/** What the bridge reports about a picked element. Every field is capped by the bridge AND re-validated by LabOS. */
export type ElementDescriptor = {
  /** Best-effort unique CSS selector within the app document. */
  selector: string;
  tag: string;
  /** Visible text, whitespace-collapsed, ≤ 200 chars. */
  text: string;
  /** Redacted, truncated `outerHTML` (≤ 2000 chars). Text only — never rendered. */
  html: string;
  role: string | null;
  ariaLabel: string | null;
  /** Nearest named React component, when the app is a React app and the name survived minification. */
  component: string | null;
  /** `file:line` when React dev builds expose `_debugSource`. Almost always null in production. */
  source: string | null;
  rect: BridgeRect;
  page: { path: string; title: string; viewportW: number; viewportH: number };
};

type Msg<T extends string, P = undefined> = P extends undefined ? { type: T } : { type: T; payload: P };

/** LabOS → app. */
export type ParentMessage =
  | Msg<'hello'>
  | Msg<'pick:start'>
  | Msg<'pick:stop'>
  | Msg<'pins:unwatch', { pinIds: string[] }>
  | Msg<'pins:clear'>
  | Msg<'crop', { pinId: string }>;

/** App → LabOS. */
export type AppMessage =
  /** `session` is random per page load: a new value means the app loaded a new document and our pins are gone. */
  | Msg<'ready', { capabilities: BridgeCapability[]; session: string }>
  | Msg<'pick:selected', { pinId: string; element: ElementDescriptor }>
  | Msg<'pick:cancelled'>
  | Msg<'pins:rects', { rects: Record<string, BridgeRect | null> }>
  | Msg<'crop:result', { pinId: string; dataUrl?: string; error?: string }>;

export type Envelope<M> = M & { ns: typeof BRIDGE_NS; v: typeof BRIDGE_VERSION; id: string };

export const LIMITS = {
  selector: 500,
  text: 200,
  html: 2000,
  name: 120,
  path: 2048,
  title: 200,
  /** A data URL longer than this is refused on both sides (≈ 3 MB of PNG). */
  cropDataUrl: 4_000_000,
  pins: 20,
} as const;

let counter = 0;
export function nextMessageId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export function envelope<M extends { type: string }>(message: M): Envelope<M> {
  return { ns: BRIDGE_NS, v: BRIDGE_VERSION, id: nextMessageId(), ...message };
}

/** Structural check only; the caller still validates each payload it uses. */
export function isEnvelope(data: unknown): data is Envelope<{ type: string; payload?: unknown }> {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return d.ns === BRIDGE_NS && d.v === BRIDGE_VERSION && typeof d.type === 'string' && typeof d.id === 'string';
}
