import { AiAppFeedbackPage } from '@/components/page/ai-apps/AiAppFeedbackPage';
import { AiAppFeedbackAccessGuard } from '@/components/page/ai-apps/AiAppFeedbackPage/components/AiAppFeedbackAccessGuard';

export default function Page() {
  return (
    <AiAppFeedbackAccessGuard>
      <AiAppFeedbackPage />
    </AiAppFeedbackAccessGuard>
  );
}
