import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const mockTopics = [
  { uid: '1', name: 'Protocol Labs' },
  { uid: '2', name: 'Filecoin' },
  { uid: '3', name: 'IPFS' },
  { uid: '4', name: 'Libp2p' },
  { uid: '5', name: 'Research' }
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