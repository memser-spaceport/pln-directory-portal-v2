// Quill stores every space as &nbsp;, which stops a line from wrapping.
const NBSP = /&nbsp;|&#0*160;|&#x0*a0;| /gi;

/** HTML with every non-breaking space as a plain space, so its lines wrap. */
export function plainSpaces(html: string): string {
  return html.replace(NBSP, ' ');
}
