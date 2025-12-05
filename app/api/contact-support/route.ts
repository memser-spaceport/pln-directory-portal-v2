import { NextRequest, NextResponse } from 'next/server';

const url = `${process.env.DIRECTORY_API_URL}/v1/contact-support`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { topic, email, name, message } = body;

    if (!email || !name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, and message are required' },
        { status: 400 },
      );
    }

    // Forward the request to the backend API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic || 'Contact support',
        email,
        name,
        message,
        metadata: body.metadata || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);

      return NextResponse.json(
        { error: errorData.message || 'Failed to send contact support request' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Contact support error:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending the contact support request' },
      { status: 500 },
    );
  }
}
