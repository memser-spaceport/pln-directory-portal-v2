import { Suspense } from 'react';

import { AiAppsConnectPage } from '@/components/page/ai-apps/AiAppsConnectPage';

export default function Page() {
  return (
    <Suspense>
      <AiAppsConnectPage />
    </Suspense>
  );
}
