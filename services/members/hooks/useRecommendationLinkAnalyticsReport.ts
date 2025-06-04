import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function useRecommendationLinkAnalyticsReport() {
  const reportRef = useRef<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium') ?? '';
  const utmCode = searchParams.get('utm_code') ?? '';
  const targetId = searchParams.get('target_uid') ?? '';

  const analytics = useMemberAnalytics();

  useEffect(() => {
    if (!reportRef.current && utmSource === 'recommendations') {
      reportRef.current = true;
      analytics.onOpenProfileByRecommendationEmailLink(utmSource, utmMedium, utmCode, targetId);

      router.replace(pathname);
    }
  }, [analytics, pathname, router, targetId, utmCode, utmMedium, utmSource]);
}
