import { getDocument } from 'pdfjs-dist';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Generate a preview image from a PDF file
 * @param file - The PDF file to generate preview from
 * @param scale - Scale factor for rendering (default: 1.0)
 * @param quality - Image quality for JPEG (0-1, default: 0.8)
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generatePdfPreview(file: File, scale: number = 1.0, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

        // Load the PDF document
        const pdf = await getDocument({ data: typedArray }).promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Calculate the viewport
        const viewport = page.getViewport({ scale });

        // Create a canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to get canvas context');
        }

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page to the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate preview image'));
              return;
            }

            // Convert blob to File
            const previewFile = new File([blob], `preview-${file.name.replace('.pdf', '')}.jpg`, {
              type: 'image/jpeg',
            });

            resolve(previewFile);
          },
          'image/jpeg',
          quality,
        );
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a preview image from a PDF URL
 * @param pdfUrl - URL of the PDF file
 * @param scale - Scale factor for rendering (default: 1.0)
 * @param quality - Image quality for JPEG (0-1, default: 0.8)
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generatePdfPreviewFromUrl(
  pdfUrl: string,
  scale: number = 1.0,
  quality: number = 0.8,
): Promise<File> {
  try {
    // Fetch the PDF with proper headers to handle S3 signed URLs
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Validate that we got a PDF
    if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
      throw new Error('Response is not a PDF file');
    }

    const file = new File([blob], 'preview-document.pdf', { type: 'application/pdf' });

    return generatePdfPreview(file, scale, quality);
  } catch (error) {
    throw new Error(`Failed to generate preview from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate preview image for existing PDF and return it as File
 * @param pdfUrl - URL of the existing PDF
 * @param teamUid - Optional team UID for admin uploads
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generatePreviewForExistingPdf(pdfUrl: string, teamUid?: string): Promise<File> {
  return generatePdfPreviewFromUrl(pdfUrl, 1.0, 0.8);
}
