import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const mockTags = [
  { uid: '1', name: 'Network' },
  { uid: '3', name: 'Labs' },
  { uid: '4', name: 'Technology' },
  { uid: '5', name: 'Storage' },
  { uid: '6', name: 'Blockchain' },
  { uid: '7', name: 'Web3' },
  { uid: '8', name: 'Development' },
  { uid: '9', name: 'P2P' },
  { uid: '10', name: 'Research' }
];

export async function GET(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(mockTags);
} 