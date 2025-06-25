import { useSearchParams } from 'next/navigation';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { useEffect, useRef } from 'react';

export function useRecommendationsSettingsEvents() {
  const reportedRef = useRef(false);
  const searchParams = useSearchParams();

  const isFromExampleMail = searchParams.get('utm_source') === 'recommendations_example';
  const isFromRecommendationMail = searchParams.get('utm_source') === 'recommendations';

  const { onRecommendationsPageOpenFromMail } = useSettingsAnalytics();

  useEffect(() => {
    if (reportedRef.current) {
      return;
    }

    if (!isFromExampleMail && !isFromRecommendationMail) {
      return;
    }

    reportedRef.current = true;

    onRecommendationsPageOpenFromMail(searchParams);
  }, [isFromExampleMail, isFromRecommendationMail, onRecommendationsPageOpenFromMail, searchParams]);
}
