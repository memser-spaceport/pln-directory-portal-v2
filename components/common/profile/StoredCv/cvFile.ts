/**
 * Small facts about a stored CV that the card and the attachment line print.
 *
 * Split out of the prototype's `mockCv.ts`, which mixed these with the sample
 * document it builds on the client. The mocks stayed behind; these are the
 * parts that describe a real file.
 */

/** "Uploaded 12 Aug 2026" — the profile's own phrasing for the upload date. */
export function formatUploadedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "PDF" from "polina-bublii-cv.pdf" — the meta line's first fact. */
export function fileKind(fileName: string): string {
  const ext = fileName.split('.').pop();
  return ext && ext !== fileName ? ext.toUpperCase() : 'File';
}

/**
 * Whether the preview can render it — pdf.js opens PDFs and nothing else.
 *
 * The backend only accepts `application/pdf`, so in practice this is true for
 * every stored CV. Kept as a test rather than an assumption because the card
 * has a perfectly good answer when it is false (the document icon), and a
 * rejected upload type is a cheaper thing to change than a card that assumes.
 */
export const isPdfName = (fileName: string) => fileKind(fileName) === 'PDF';
