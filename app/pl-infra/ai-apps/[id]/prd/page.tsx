'use client';

import { use } from 'react';

import { AiAppPrdPage } from '@/components/page/ai-apps/AiAppPrdPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

interface Props {
  params: Promise<{ id: string }>;
}

export default function Page(props: Props) {
  const params = use(props.params);

  return (
    <AiAppsAccessGuard>
      <AiAppPrdPage uid={params.id} />
    </AiAppsAccessGuard>
  );
}
