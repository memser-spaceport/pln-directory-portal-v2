/**
 * The CV a profile carries — the *file*, as distinct from the fields read out of
 * it.
 *
 * Until now the importer's contract was "read, not kept": the document filled in
 * the profile and was discarded, and the job board's privacy line said so. This
 * type is the other half of the product decision that the CV goes with
 * applications: a kept file needs a resting state (see it, replace it, remove
 * it), and a resting state needs a record to render.
 *
 * Deliberately not the parse. `ParsedProfile` is what a document *said* and
 * lives only between reading and Save; this is what the profile *holds* and
 * lives on the record. Removing one does not remove the other — see
 * `RemoveCvDialog` for the sentence that promises that.
 *
 * Mirrors what the backend's import row already carries (`originalFilename`,
 * and a size and timestamp any upload has), so the shape is a description of
 * production's data rather than an invention for the prototype.
 */
export interface StoredCv {
  fileName: string;
  /** Bytes, as `File.size` reports them — `formatFileSize` renders it. */
  size: number;
  /** ISO timestamp of the upload — the profile's own "Uploaded 12 Aug 2026". */
  uploadedAt: string;
  /**
   * Where the bytes are. A real upload has a URL; the prototype's mock builds a
   * small genuine PDF on the client (`mockCv.ts`) so the preview renders a
   * document rather than a picture of one. Absent only before that build runs.
   */
  url?: string;
}
