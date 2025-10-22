'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export interface UtmParams {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/**
 * Hook to extract UTM parameters from the current URL
 * @returns Object containing UTM parameters or null values
 */
export const useUtmParams = (): UtmParams => {
  const searchParams = useSearchParams();

  return useMemo(() => {
    return {
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCampaign: searchParams.get('utm_campaign'),
    };
  }, [searchParams]);
};
