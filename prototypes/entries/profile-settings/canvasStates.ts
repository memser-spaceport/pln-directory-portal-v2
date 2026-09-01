/**
 * Review-only URL states, for the design canvas at `/design-canvas/cv-upload`.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * Two states, and both exist for one thing the other two surfaces cannot show:
 * the importer's **door** variant. This page seeds a history, so its Experience
 * section opens on a list — and the panel's empty-state pill, plus the drop area
 * one step behind it, are only reachable once that list is empty.
 *
 * Nothing on the page links to either. They are read in one place
 * (`ProfileSettingsPrototype`'s mount effect), so deleting the canvas is
 * deleting this file and three lines.
 */

/** The query key the canvas appends. Fixed by `design-canvas/core` — see its `types.ts`. */
export const CANVAS_STATE_PARAM = 'canvas';

export interface SettingsCanvasState {
  /** Drops the seeded history, which is what puts the offer in this section. */
  noHistory?: boolean;
  /** Opens the drop area behind the pill. */
  importOpen?: boolean;
}

export const CANVAS_STATES: Record<string, SettingsCanvasState> = {
  'no-history': { noHistory: true },
  'no-history-open': { noHistory: true, importOpen: true },
};

/** Reads the pinned state off a query string. Unknown or absent → nothing pinned. */
export function readCanvasState(search: string): SettingsCanvasState | null {
  try {
    const raw = new URLSearchParams(search).get(CANVAS_STATE_PARAM);
    if (!raw) return null;
    return CANVAS_STATES[raw] ?? null;
  } catch {
    /* No parsable query — the page opens on its seeded history, which is the
       state it would have been in anyway. */
    return null;
  }
}
