import type { ParsedProfile } from './types';

/**
 * The import's callbacks, bundled so they can reach the empty row.
 *
 * The drop area belongs *inside* `ExperiencesList`'s empty state — that is the
 * `.connectButton` slot it fills — but the state it drives (which card is open,
 * what came back, which file the header collected) belongs to
 * `ExperienceDetails`, two levels up. Something has to travel down.
 *
 * A bundle rather than five loose props, and **optional rather than paired with
 * a boolean**: `cvImport === undefined` is the feature being off. That way no
 * component between here and the empty row carries a flag, an `enabled` prop, or
 * a branch that can disagree with the one above it — there is nothing to
 * disagree about, because when the feature is off there is nothing to pass.
 */
export interface CvImportControls {
  /** Reads the document. Rejects on failure; resolving empty is a document with
   *  nothing in it. */
  onParse: (file: File) => Promise<ParsedProfile>;
  /** Drops an in-flight read. */
  onAbort: () => void;
  /** A read came back with something. The section swaps to the review. */
  onParsed: (parsed: ParsedProfile) => void;
  /** The way out of a dead end: the section's own Add form. */
  onAddManually: () => void;
  /** A file collected by the header control, on its way to the same validator
   *  the drop area uses. */
  onPickFile: (file: File) => void;
  /** The empty-row pill was pressed. Analytics only. */
  onDoorOpened: () => void;
  /** Cancel was pressed while reading. Analytics only — see the panel's prop. */
  onCancelRead: () => void;
}
