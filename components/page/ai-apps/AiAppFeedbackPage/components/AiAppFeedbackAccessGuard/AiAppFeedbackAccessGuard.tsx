'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

interface Props {
  readonly children: ReactNode;
}

/**
 * Unlike AiAppsAccessGuard (a single ai_apps.read check), review access also
 * requires being a Directory admin or owning at least one AI App - see
 * useAiAppFeedbackReviewAccess for the derivation.
 */
export function AiAppFeedbackAccessGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const analytics = useAiAppsAnalytics();
  const deniedTracked = useRef(false);
  const { canReview, isLoading, isError } = useAiAppFeedbackReviewAccess();

  useEffect(() => {
    if (!isLoading && (isError || !canReview)) {
      if (!deniedTracked.current) {
        deniedTracked.current = true;
        analytics.onAccessDenied(pathname);
      }
      router.replace('/pl-infra/ai-apps');
    }
  }, [isLoading, isError, canReview, router, pathname, analytics]);

  if (isLoading || isError || !canReview) {
    return null;
  }

  return <>{children}</>;
}
