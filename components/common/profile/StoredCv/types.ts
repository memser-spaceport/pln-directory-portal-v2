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
 * Mirrors what the API returns for a stored CV. Note that `MemberCvImport`
 * carries `originalFilename` and `createdAt` but **no size column** — the
 * prototype this came from assumed one. Size is read from S3 at serve time
 * instead, which is why it is optional here.
 */
export interface StoredCv {
  fileName: string;
  /**
   * Bytes — `formatFileSize` renders it.
   *
   * Optional because the API reads it from S3 with `HeadObject` at serve time
   * rather than from a column (there isn't one, and adding one would leave every
   * CV uploaded before that migration sizeless forever). That read is allowed to
   * fail on its own: a card missing "182 KB" beats a card missing the document.
   */
  size?: number;
  /** ISO timestamp of the upload — the profile's own "Uploaded 12 Aug 2026". */
  uploadedAt: string;
  /**
   * Where the bytes are — a short-lived signed link from
   * `GET /v1/members/:uid/cv-imports/file`. Optional because the card is also
   * rendered from what `latest` alone knows while that link is being fetched.
   */
  url?: string;
}
