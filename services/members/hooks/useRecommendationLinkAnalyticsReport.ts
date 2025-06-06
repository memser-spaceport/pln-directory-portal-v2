import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember } from '@/types/members.types';

export function useRecommendationLinkAnalyticsReport(member: IMember) {
  const reportRef = useRef<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium') ?? '';
  const utmCode = searchParams.get('utm_code') ?? '';
  const targetId = searchParams.get('target_uid') ?? '';
  const targetEmail = searchParams.get('target_email') ?? '';

  const analytics = useMemberAnalytics();

  useEffect(() => {
    if (!reportRef.current && utmSource === 'recommendations' && member) {
      reportRef.current = true;
      analytics.onOpenProfileByRecommendationEmailLink(utmSource, utmMedium, utmCode, member.name, targetId, targetEmail);

      router.replace(pathname);
    }
  }, [analytics, pathname, router, targetId, utmCode, utmMedium, utmSource, member, targetEmail]);
}
