import { getDocument } from 'pdfjs-dist';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Generate a preview image from a PDF file
 * @param file - The PDF file to generate preview from
 * @param scale - Scale factor for rendering (default: 2.0 for better quality)
 * @param format - Image format: 'png' or 'jpeg' (default: 'png' for better quality)
 * @param quality - Image quality for JPEG (0-1, default: 0.95)
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generatePdfPreview(
  file: File,
  scale: number = 2.0,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.95,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

        // Load the PDF document
        const pdf = await getDocument({ data: typedArray }).promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Calculate the viewport with higher scale for better quality
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

        // Improve canvas rendering quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Render the page to the canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob with improved quality settings
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const fileExtension = format === 'png' ? '.png' : '.jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate preview image'));
              return;
            }

            // Convert blob to File with appropriate extension
            const previewFile = new File([blob], `preview-${file.name.replace('.pdf', '')}${fileExtension}`, {
              type: mimeType,
            });

            resolve(previewFile);
          },
          mimeType,
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
 * @param scale - Scale factor for rendering (default: 2.0)
 * @param format - Image format: 'png' or 'jpeg' (default: 'png')
 * @param quality - Image quality for JPEG (0-1, default: 0.95)
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generatePdfPreviewFromUrl(
  pdfUrl: string,
  scale: number = 2.0,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.95,
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

    return generatePdfPreview(file, scale, format, quality);
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
  return generatePdfPreviewFromUrl(pdfUrl, 2.0, 'png', 0.95);
}

/**
 * Generate a high-quality preview image with enhanced rendering
 * @param file - The PDF file to generate preview from
 * @param scale - Scale factor for rendering (default: 3.0 for maximum quality)
 * @param format - Image format: 'png' or 'jpeg' (default: 'png')
 * @param quality - Image quality for JPEG (0-1, default: 0.98)
 * @returns Promise that resolves to a File object containing the preview image
 */
export async function generateHighQualityPdfPreview(
  file: File,
  scale: number = 3.0,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.98,
): Promise<File> {
  return generatePdfPreview(file, scale, format, quality);
}

/**
 * Generate preview with text content extraction for better accessibility
 * @param file - The PDF file to process
 * @param scale - Scale factor for rendering
 * @returns Promise that resolves to an object with preview File and text content
 */
export async function generatePdfPreviewWithText(
  file: File,
  scale: number = 2.0,
): Promise<{ previewFile: File; textContent: string }> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

        // Load the PDF document
        const pdf = await getDocument({ data: typedArray }).promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Extract text content
        const textContent = await page.getTextContent();
        const textItems = textContent.items as any[];
        const extractedText = textItems
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        // Generate preview image
        const previewFile = await generatePdfPreview(file, scale, 'png', 0.95);

        resolve({
          previewFile,
          textContent: extractedText,
        });
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
