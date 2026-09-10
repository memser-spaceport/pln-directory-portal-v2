import { Suspense } from 'react';

import { AiAppsPage } from '@/components/page/ai-apps/AiAppsPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';
import { AiAppsFilterUrlSync } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsFilterUrlSync';

export default function Page() {
  return (
    <AiAppsAccessGuard>
      <Suspense>
        <AiAppsFilterUrlSync>
          <AiAppsPage />
        </AiAppsFilterUrlSync>
      </Suspense>
    </AiAppsAccessGuard>
  );
}
