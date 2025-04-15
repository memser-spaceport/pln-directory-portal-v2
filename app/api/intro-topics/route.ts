import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const mockTopics = [
  { id: '1', name: 'Protocol Labs' },
  { id: '2', name: 'Filecoin' },
  { id: '3', name: 'IPFS' },
  { id: '4', name: 'Libp2p' },
  { id: '5', name: 'Research' }
];

export async function GET(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(mockTopics);
} 