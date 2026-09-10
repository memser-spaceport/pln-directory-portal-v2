'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

/* The worker, bundled from `pdfjs-dist` rather than fetched from unpkg.
   Production's `PdfViewer` points at `//unpkg.com/...`, which on a plain-http
   dev server resolves to http://unpkg.com and is refused by CORS — the page
   then never paints. This is react-pdf's own documented webpack 5 form, which
   Next emits as a static asset, so the preview works for every viewer of the
   prototype with no network. Set at module scope for the reason production
   sets it there: `Document` reads it on mount. */
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface CvPdfPageProps {
  url: string;
  /** Rendered width in CSS px — the canvas scales each page to it. */
  width: number;
  /** `first` paints page one only (the thumbnail); `all` stacks every page (the reader). */
  pages?: 'first' | 'all';
  /** Something to show until the page paints (and instead of it, on failure). */
  fallback?: React.ReactNode;
  onLoadSuccess?: () => void;
  /** Between stacked pages, in px. Ignored for `first`. */
  gap?: number;
}

/**
 * A PDF's pages at a width, and nothing else.
 *
 * Two callers, one wrapper. The resting card wants page one small — no text
 * layer, no annotation layer, no chrome. The preview modal wants the whole
 * document readable, stacked and scrolled the way a CV is actually read (top
 * to bottom, not paged with Previous/Next).
 *
 * **Why not production's `PdfViewer` for the modal.** It is a paged reader
 * built for a one-slide pitch deck, and it sets the pdf.js worker to a CDN URL
 * on import — which overrides the bundled worker above for every `Document`
 * on the page and, on a plain-http dev server, fails CORS. One wrapper with a
 * `pages` switch keeps the thumbnail and the reader on one worker and one
 * version of the library. The chrome around it (the card, the close disc, the
 * name) is still the product's — see `CvPreviewModal`.
 *
 * **Loaded through `next/dynamic` with `ssr: false` by every caller.** react-pdf
 * touches `window` at import, and prototype routes server-render — importing it
 * statically 500s the route (`project-prototypes-ssr-browser-libs`).
 */
export default function CvPdfPage({ url, width, pages = 'first', fallback = null, onLoadSuccess, gap = 16 }: CvPdfPageProps) {
  const [count, setCount] = useState(1);
  const numbers = pages === 'all' ? Array.from({ length: count }, (_, i) => i + 1) : [1];

  return (
    <Document
      file={url}
      loading={fallback}
      error={fallback}
      noData={fallback}
      onLoadSuccess={({ numPages }) => setCount(numPages)}
    >
      {numbers.map((n) => (
        <div key={n} style={n > 1 ? { marginTop: gap } : undefined}>
          <Page
            pageNumber={n}
            width={width}
            /* The thumbnail is 31px wide, so a 1:1 canvas turns a page of text
               into three grey smudges on a standard display. Rendered at 2x and
               painted at 1x it stays a page. Only for `first`: the reader is
               already at reading size and a 2x canvas per page is real memory. */
            devicePixelRatio={pages === 'first' ? 2 : undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={n === 1 ? fallback : null}
            onRenderSuccess={n === 1 ? onLoadSuccess : undefined}
          />
        </div>
      ))}
    </Document>
  );
}
