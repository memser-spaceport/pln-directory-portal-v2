import { MyAiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';
import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';

export default function Page() {
  return (
    <AiAppsAccessGuard>
      <MyAiAppFeedbackPage />
    </AiAppsAccessGuard>
  );
}
