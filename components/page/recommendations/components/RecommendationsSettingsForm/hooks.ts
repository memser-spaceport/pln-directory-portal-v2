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

    const searchParamsObj = {
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCode: searchParams.get('utm_code'),
      targetUid: searchParams.get('target_uid'),
      targetEmail: searchParams.get('target_email'),
    };

    onRecommendationsPageOpenFromMail(searchParamsObj);
  }, [isFromExampleMail, isFromRecommendationMail, onRecommendationsPageOpenFromMail, searchParams]);
}
