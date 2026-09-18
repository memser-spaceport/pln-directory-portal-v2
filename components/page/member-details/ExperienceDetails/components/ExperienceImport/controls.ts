import type { ParsedProfile } from './types';

/**
 * The import's callbacks, bundled so they can reach the empty row.
 *
 * The drop area belongs *inside* `ExperiencesList`'s empty state, but the state
 * it drives (which card is open, what came back, which file the header
 * collected) belongs to `ExperienceDetails`, two levels up. Something has to
 * travel down.
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
  /**
   * Cancel was pressed while reading. Analytics, and — when the host opened
   * this card for a refresh — leaving it. See `ExperienceDetails.onCancelRead`.
   */
  onCancelRead: () => void;
  /**
   * Whether the **drop area** belongs to this section's empty row, as distinct
   * from the header's "Update from CV" — which every host that offers the import
   * at all wants, because it is the only way back to the importer once entries
   * exist.
   *
   * False on `/members/[id]`, where `MemberCvSection` carries a drop area
   * permanently: two boxes to drop a file into, on one page, is the choice
   * nobody can get right or wrong that `pickCvImportHost` exists to prevent.
   * True in the apply drawer, where this section's empty row is one of the two
   * hosts that picker chooses between.
   *
   * In the bundle rather than beside it for the same reason the callbacks are:
   * one object arrives or it doesn't, and no component between here and the
   * empty row holds a second opinion about what is being offered.
   */
  hostsEmptyRow: boolean;
}
