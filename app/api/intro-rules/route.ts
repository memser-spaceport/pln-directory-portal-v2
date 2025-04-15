import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Rule } from '@/types/intro-rules';

const mockRules: Rule[] = [
  {
    id: '1',
    name: 'Protocol Labs Network',
    tags: ['Network', 'Protocol', 'Labs', 'Technology'],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '5', name: 'Charlie Davis', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },    
    ]
  },
  {
    id: '2',
    name: 'Filecoin Network',
    tags: ['Storage', 'Blockchain', 'Web3', 'Decentralized'],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '5', name: 'Charlie Davis', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
    ]
  },
  {
    id: '3',
    name: 'IPFS Development',
    tags: ['Development', 'P2P', 'Storage', 'Protocol'],
    leads: [
      { id: '1', name: 'John Doe', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '2', name: 'Jane Smith', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '3', name: 'Alice Johnson', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '4', name: 'Bob Brown', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
      { id: '5', name: 'Charlie Davis', avatar: '/icons/avatar-placeholder.svg', role: 'Lead' },
    ]
  }
];

const mockTopics = [
  { id: '1', name: 'Protocol Labs' },
  { id: '2', name: 'Filecoin' },
  { id: '3', name: 'IPFS' },
  { id: '4', name: 'Libp2p' },
  { id: '5', name: 'Research' }
];

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