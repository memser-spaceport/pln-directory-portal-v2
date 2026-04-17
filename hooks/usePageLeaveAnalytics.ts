import { useEffect, useRef } from 'react';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useUtmParams } from './useUtmParams';

export interface PageLeaveAnalyticsConfig {
  postHogEventFunction?: () => void;
  customEventName: string;
  path: string;
  additionalProperties?: Record<string, any>;
  requireAuth?: boolean;
  distinctId?: string;
  skip?: boolean;
}

export const usePageLeaveAnalytics = (config: PageLeaveAnalyticsConfig) => {
  const {
    postHogEventFunction,
    customEventName,
    path,
    additionalProperties = {},
    requireAuth = true,
    distinctId: customDistinctId,
    skip = false,
  } = config;

  const reportAnalytics = useReportAnalyticsEvent();
  const hasReported = useRef(false);
  const utmParams = useUtmParams();

  const postHogRef = useRef(postHogEventFunction);
  const customNameRef = useRef(customEventName);
  const pathRef = useRef(path);
  const additionalRef = useRef(additionalProperties);
  const requireAuthRef = useRef(requireAuth);
  const distinctIdRef = useRef(customDistinctId);
  const reportMutateRef = useRef(reportAnalytics.mutate);
  const utmRef = useRef(utmParams);

  postHogRef.current = postHogEventFunction;
  customNameRef.current = customEventName;
  pathRef.current = path;
  additionalRef.current = additionalProperties;
  requireAuthRef.current = requireAuth;
  distinctIdRef.current = customDistinctId;
  reportMutateRef.current = reportAnalytics.mutate;
  utmRef.current = utmParams;

  useEffect(() => {
    if (skip) {
      return;
    }

    hasReported.current = false;

    const reportLeave = () => {
      if (hasReported.current) {
        return;
      }

      const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
      const distinctId = distinctIdRef.current || userInfo?.email;

      if (requireAuthRef.current && (!userInfo?.email || !distinctId)) {
        return;
      }

      if (!requireAuthRef.current && !distinctId) {
        return;
      }

      hasReported.current = true;

      if (postHogRef.current) {
        try {
          postHogRef.current();
        } catch (error) {
          console.error('Error calling PostHog leave analytics:', error);
        }
      }

      const leaveEvent: TrackEventDto = {
        name: customNameRef.current,
        distinctId: distinctId!,
        properties: {
          ...(requireAuthRef.current &&
            userInfo && {
              userId: userInfo.uid,
              userEmail: userInfo.email,
              userName: userInfo.name,
            }),
          path: pathRef.current,
          timestamp: new Date().toISOString(),
          ...utmRef.current,
          ...additionalRef.current,
        },
      };

      reportMutateRef.current(leaveEvent);
    };

    const onPageHide = () => reportLeave();

    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      reportLeave();
    };
  }, [skip]);
};

export const useDemoDayPageLeaveAnalytics = (
  eventName: keyof ReturnType<typeof useDemoDayAnalytics>,
  customEventName: string,
  path: string,
  additionalProperties?: Record<string, any>,
  options?: { skip?: boolean },
) => {
  const demoDayAnalytics = useDemoDayAnalytics();
  const utmParams = useUtmParams();

  const postHogEventFunction = () => {
    const eventFunction = demoDayAnalytics[eventName] as (eventParams?: Record<string, any>) => void;
    eventFunction(utmParams);
  };

  return usePageLeaveAnalytics({
    postHogEventFunction,
    customEventName,
    path,
    additionalProperties,
    skip: options?.skip,
  });
};
