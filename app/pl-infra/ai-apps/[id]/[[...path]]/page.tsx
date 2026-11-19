'use client';

import { use } from 'react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

interface Props {
  params: Promise<{ id: string; path?: string[] }>;
}

export default function Page(props: Props) {
  const params = use(props.params);

  return (
    // A member without AI Apps access who follows a catalog link to an app published to them lands on /apps/… (LAB-3336).
    <AiAppsAccessGuard publishedAppSegment={params.id}>
      <AiAppDetailPage uid={params.id} basePath={`/pl-infra/ai-apps/${params.id}`} />
    </AiAppsAccessGuard>
  );
}
