import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const mockTags = [
  { id: '1', name: 'Network' },
  { id: '2', name: 'Protocol' },
  { id: '3', name: 'Labs' },
  { id: '4', name: 'Technology' },
  { id: '5', name: 'Storage' },
  { id: '6', name: 'Blockchain' },
  { id: '7', name: 'Web3' },
  { id: '8', name: 'Development' },
  { id: '9', name: 'P2P' },
  { id: '10', name: 'Research' }
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