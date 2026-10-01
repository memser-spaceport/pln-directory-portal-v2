import type { BridgeRect, ElementDescriptor } from '@/ai-apps-bridge/protocol';

export type PinCrop = { status: 'pending' } | { status: 'done'; dataUrl: string } | { status: 'failed'; error: string };

export type ElementPin = {
  /** Assigned by the bridge (`pin-3`); unique for the frame's lifetime. */
  id: string;
  /** Validated snapshot taken at pick time. Never rendered as HTML. */
  element: ElementDescriptor;
  /** Where the element is now, in the app's viewport. `null` = detached (gone from the page). */
  rect: BridgeRect | null;
  note: string;
  crop: PinCrop;
  /** Where in the element the member clicked (0–1 of its box); null from a bridge that predates it. */
  point: { ox: number; oy: number } | null;
};
