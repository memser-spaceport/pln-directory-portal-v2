/**
 * Creates a proxy URL for fetching PDFs to avoid CORS issues
 * @param originalUrl - The original PDF URL that might be blocked by CORS
 * @returns The proxied URL that can be used to fetch the PDF through the application
 */
export function createPdfProxyUrl(originalUrl: string): string {
  if (!originalUrl) {
    return '';
  }
  
  // If the URL is already a proxy URL, return it as is
  if (originalUrl.startsWith('/api/proxy-pdf')) {
    return originalUrl;
  }
  
  return `/api/proxy-pdf?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Checks if a URL is a PDF based on its extension or content type
 * @param url - The URL to check
 * @returns boolean indicating if the URL points to a PDF
 */
export function isPdfUrl(url: string): boolean {
  if (!url) return false;
  
  const lowercaseUrl = url.toLowerCase();
  return lowercaseUrl.includes('.pdf') || lowercaseUrl.includes('pdf');
}
