import { Suspense } from 'react';

import { AiAppsPage } from '@/components/page/ai-apps/AiAppsPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

export default function Page() {
  return (
    <AiAppsAccessGuard>
      <Suspense>
        <AiAppsPage />
      </Suspense>
    </AiAppsAccessGuard>
  );
}
