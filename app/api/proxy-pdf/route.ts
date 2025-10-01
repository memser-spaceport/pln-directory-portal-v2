import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the URL parameter from the query string
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('url');

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate that the URL is a valid URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(pdfUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Optional: Add URL validation for security (whitelist domains if needed)
    // const allowedDomains = ['example.com', 'trusted-domain.com'];
    // if (!allowedDomains.includes(validatedUrl.hostname)) {
    //   return NextResponse.json(
    //     { error: 'Domain not allowed' },
    //     { status: 403 }
    //   );
    // }

    // Fetch the PDF from the external URL
    const response = await fetch(validatedUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Proxy/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Validate that it's actually a PDF
    if (!contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
      return NextResponse.json(
        { error: 'The requested resource is not a PDF file' },
        { status: 400 }
      );
    }

    // Get the PDF content as a buffer
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('PDF proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching PDF' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
