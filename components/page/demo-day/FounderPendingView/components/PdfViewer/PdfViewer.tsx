'use client';

import { Document, Page } from 'react-pdf';
import { useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { pdfjs } from 'react-pdf';
import s from './PdfViewer.module.scss';

// pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string;
  isPreview?: boolean;
}

export default function PdfViewer({ fileUrl, isPreview = false }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className={`${s.pdfViewerContainer} ${isPreview ? s.previewMode : ''}`}>
      <div className={s.documentContainer}>
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            width={undefined}
            height={undefined}
            scale={1}
            renderTextLayer={!isPreview}
            renderAnnotationLayer={!isPreview}
          />
        </Document>
      </div>
      {numPages && numPages > 1 && !isPreview && (
        <div className={s.navigationContainer}>
          <button
            className={s.navButton}
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <p className={s.pageInfo}>
            Page {pageNumber} of {numPages}
          </p>
          <button
            className={s.navButton}
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
