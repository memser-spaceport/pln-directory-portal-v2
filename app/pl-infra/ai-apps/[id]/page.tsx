'use client';

import { use } from 'react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page(props: Props) {
  const params = use(props.params);

  return <AiAppDetailPage uid={params.id} />;
}
