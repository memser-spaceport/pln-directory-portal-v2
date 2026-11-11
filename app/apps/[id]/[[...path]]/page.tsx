'use client';

import { use } from 'react';

import { PublishedAiAppPage } from '@/components/page/ai-apps/PublishedAiAppPage';
import { PUBLISHED_AI_APPS_PATH } from '@/services/ai-apps/constants';

interface Props {
  params: Promise<{ id: string; path?: string[] }>;
}

// Not behind AiAppsAccessGuard: the members a published app is opened to have
// no `ai_apps.read`. The published list decides who sees the app (LAB-3200).
export default function Page(props: Props) {
  const params = use(props.params);

  return <PublishedAiAppPage uid={params.id} basePath={`${PUBLISHED_AI_APPS_PATH}/${params.id}`} />;
}
