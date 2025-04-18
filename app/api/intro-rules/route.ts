import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const mockRules = [
  {
    id: '1',
    topic: { uid: '5', name: 'Research' },
    tags: [{ uid: '1', name: 'Network' },
      { uid: '3', name: 'Labs' },
      { uid: '4', name: 'Technology' },],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/default_profile.svg', role: 'Lead' }, 
    ]
  },
  {
    id: '2',
    topic: { uid: '1', name: 'Protocol Labs' },
    tags: [
      { uid: '5', name: 'Storage' },
      { uid: '6', name: 'Blockchain' },
      { uid: '7', name: 'Web3' },
    ],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '5', name: 'Charlie Davis', avatar: '/icons/default_profile.svg', role: 'Lead' },
    ]
  },
  {
    id: '3',
    topic: { uid: '3', name: 'IPFS' },
    tags: [
      { uid: '8', name: 'Development' },
      { uid: '9', name: 'P2P' },
      { uid: '10', name: 'Research' },
      { uid: '1', name: 'Network' }],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/default_profile.svg', role: 'Lead' },
      { id: '5', name: 'Charlie Davis', avatar: '/icons/default_profile.svg', role: 'Lead' },
    ]
  }
];

export async function GET(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(mockRules);
}

export async function POST(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  
  return NextResponse.json({
    id: (mockRules.length + 1).toString(),
    ...body
  }, { status: 201 });
}

export async function PUT(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  
  return NextResponse.json(body);
}

export async function DELETE(request: Request) {
  const headersList = headers();
  const authToken = headersList.get('authorization');

  if (!authToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return new NextResponse(null, { status: 204 });
} 