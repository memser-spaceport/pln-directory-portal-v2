# PDF Proxy Implementation

## Overview

This implementation adds a server-side proxy to handle PDF fetching from external resources, avoiding CORS (Cross-Origin Resource Sharing) issues that can occur when trying to load PDFs directly from external domains in the browser.

## Problem

The `PdfViewer` component was experiencing CORS errors when trying to fetch PDFs from external URLs. Browsers enforce CORS policies that prevent direct access to resources from different domains unless the server explicitly allows it.

## Solution

We've implemented a Next.js API route that acts as a proxy server to fetch PDFs from external sources and serve them through our application domain.

### Components

1. **API Route**: `/app/api/proxy-pdf/route.ts`
   - Handles GET requests with a `url` parameter
   - Fetches the PDF from the external URL
   - Returns the PDF content with appropriate headers
   - Includes security validations and error handling

2. **Utility Functions**: `/utils/pdf-proxy.utils.ts`
   - `createPdfProxyUrl(originalUrl)`: Creates a proxy URL for a given PDF URL
   - `isPdfUrl(url)`: Checks if a URL points to a PDF file

3. **Updated Components**:
   - `PdfViewer`: Now uses the proxy URL instead of direct URLs
   - `MediaPreview`: Updated iframe PDF display to use proxy

## Usage

### Basic Usage

```typescript
import { createPdfProxyUrl } from '@/utils/pdf-proxy.utils';

// Original PDF URL that might be blocked by CORS
const originalUrl = 'https://external-domain.com/document.pdf';

// Create proxy URL
const proxyUrl = createPdfProxyUrl(originalUrl);

// Use in components
<Document file={proxyUrl} onLoadSuccess={onDocumentLoadSuccess}>
  <Page pageNumber={pageNumber} />
</Document>
```

### API Endpoint

The proxy API accepts the following parameters:

- **URL**: `/api/proxy-pdf?url={encoded_pdf_url}`
- **Method**: GET
- **Parameters**:
  - `url` (required): The URL-encoded original PDF URL

Example:
```
/api/proxy-pdf?url=https%3A%2F%2Fexample.com%2Fdocument.pdf
```

## Security Features

1. **URL Validation**: Ensures the provided URL is valid
2. **Content Type Validation**: Verifies the response is actually a PDF
3. **Error Handling**: Proper error responses for various failure scenarios
4. **Optional Domain Whitelisting**: Can be configured to only allow specific domains

## Configuration

### Optional Domain Whitelisting

To restrict which domains can be proxied, uncomment and configure the domain whitelist in `/app/api/proxy-pdf/route.ts`:

```typescript
const allowedDomains = ['trusted-domain.com', 'another-trusted-domain.com'];
if (!allowedDomains.includes(validatedUrl.hostname)) {
  return NextResponse.json(
    { error: 'Domain not allowed' },
    { status: 403 }
  );
}
```

### Caching

The proxy includes cache headers to improve performance:
- `Cache-Control: public, max-age=3600` (1 hour cache)

## Error Handling

The proxy handles various error scenarios:

1. **Missing URL parameter**: Returns 400 Bad Request
2. **Invalid URL format**: Returns 400 Bad Request
3. **Domain not allowed**: Returns 403 Forbidden (if whitelist is enabled)
4. **Failed to fetch PDF**: Returns the original error status
5. **Invalid content type**: Returns 400 Bad Request
6. **Server errors**: Returns 500 Internal Server Error

## Testing

Tests are included in `__tests__/utils/pdf-proxy.utils.test.ts` to verify:
- Proxy URL creation
- URL encoding
- Edge cases (empty URLs, already proxied URLs)
- PDF URL detection

Run tests with:
```bash
npm test -- __tests__/utils/pdf-proxy.utils.test.ts
```

## Performance Considerations

1. **Caching**: PDFs are cached for 1 hour to reduce server load
2. **Streaming**: Large PDFs are streamed through the proxy without loading entirely into memory
3. **Error Responses**: Quick error responses for invalid requests

## Browser Compatibility

This solution works with all modern browsers and is compatible with:
- react-pdf library
- iframe PDF display
- Any other PDF viewing solution that accepts URLs
