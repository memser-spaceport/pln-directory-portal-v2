'use client';

import { use } from 'react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page(props: Props) {
  const params = use(props.params);

  return (
    <AiAppsAccessGuard>
      <AiAppDetailPage uid={params.id} />
    </AiAppsAccessGuard>
  );
}
