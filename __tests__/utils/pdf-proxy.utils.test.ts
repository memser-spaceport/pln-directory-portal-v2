import { createPdfProxyUrl, isPdfUrl } from '@/utils/pdf-proxy.utils';

describe('PDF Proxy Utils', () => {
  describe('createPdfProxyUrl', () => {
    it('should create a proxy URL for a regular PDF URL', () => {
      const originalUrl = 'https://example.com/document.pdf';
      const result = createPdfProxyUrl(originalUrl);
      expect(result).toBe('/api/proxy-pdf?url=https%3A%2F%2Fexample.com%2Fdocument.pdf');
    });

    it('should return empty string for empty input', () => {
      const result = createPdfProxyUrl('');
      expect(result).toBe('');
    });

    it('should return the same URL if it is already a proxy URL', () => {
      const proxyUrl = '/api/proxy-pdf?url=https%3A%2F%2Fexample.com%2Fdocument.pdf';
      const result = createPdfProxyUrl(proxyUrl);
      expect(result).toBe(proxyUrl);
    });

    it('should properly encode special characters in URLs', () => {
      const originalUrl = 'https://example.com/document with spaces.pdf';
      const result = createPdfProxyUrl(originalUrl);
      expect(result).toBe('/api/proxy-pdf?url=https%3A%2F%2Fexample.com%2Fdocument%20with%20spaces.pdf');
    });
  });

  describe('isPdfUrl', () => {
    it('should return true for URLs ending with .pdf', () => {
      expect(isPdfUrl('https://example.com/document.pdf')).toBe(true);
      expect(isPdfUrl('https://example.com/document.PDF')).toBe(true);
    });

    it('should return true for URLs containing pdf', () => {
      expect(isPdfUrl('https://example.com/pdf/document')).toBe(true);
      expect(isPdfUrl('https://example.com/PDF/document')).toBe(true);
    });

    it('should return false for non-PDF URLs', () => {
      expect(isPdfUrl('https://example.com/document.jpg')).toBe(false);
      expect(isPdfUrl('https://example.com/document.png')).toBe(false);
      expect(isPdfUrl('https://example.com/document')).toBe(false);
    });

    it('should return false for empty or null input', () => {
      expect(isPdfUrl('')).toBe(false);
      expect(isPdfUrl(null as any)).toBe(false);
      expect(isPdfUrl(undefined as any)).toBe(false);
    });
  });
});
