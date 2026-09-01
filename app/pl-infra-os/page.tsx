import { Suspense } from 'react';

import { AiAppDetailPage } from '@/components/page/ai-apps/AiAppDetailPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';
import { PL_INFRA_OS_APP_UID } from '@/services/ai-apps/constants';

export default function Page() {
  return (
    <AiAppsAccessGuard>
      <Suspense>
        <AiAppDetailPage uid={PL_INFRA_OS_APP_UID} />
      </Suspense>
    </AiAppsAccessGuard>
  );
}
