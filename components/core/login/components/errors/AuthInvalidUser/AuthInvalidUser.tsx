'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { VerifyEmailModal } from '../VerifyEmailModal';
import { triggerLoader, getParsedValue } from '@/utils/common.utils';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { INVITE_FORM_URL } from '@/constants/demoDay';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { authEvents, AuthErrorCode } from '../../../utils/authEvents';

interface ModalContent {
  title: string;
  errorMessage: string;
  description: string;
  variant: 'regular' | 'access_denied_demo_day';
}

const DEFAULT_CONTENT: ModalContent = {
  title: 'Email Verification',
  errorMessage: 'Email not available',
  description: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
  variant: 'regular',
};

const ERROR_CONTENT: Record<string, ModalContent> = {
  linked_to_another_user: {
    title: 'Email Verification',
    errorMessage: 'Email already used. Connect social account for login',
    description:
      'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
    variant: 'regular',
  },
  unexpected_error: {
    title: 'Something went wrong',
    errorMessage: 'We are unable to authenticate you at the moment due to technical issues. Please try again later',
    description: '',
    variant: 'regular',
  },
  rejected_access_level: {
    title: 'Access rejected',
    errorMessage: 'Your application to join the Protocol Labs network was not approved.',
    description: 'Your application to join the Protocol Labs network was not approved. You may reapply in the future.',
    variant: 'regular',
  },
};

/**
 * AuthInvalidUser - Handles auth error modal display
 *
 * Listens for 'auth-invalid-email' events and shows appropriate error modals.
 * Special handling for demo day access denied scenarios.
 */
export function AuthInvalidUser() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { onAccessDeniedModalShown, onAccessDeniedUserNotWhitelistedModalShown } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const [content, setContent] = useState<ModalContent>(DEFAULT_CONTENT);

  const handleModalClose = () => {
    triggerLoader(false);
    dialogRef.current?.close();
    setTimeout(() => setContent(DEFAULT_CONTENT), 500);
  };

  const handleModalOpen = () => {
    dialogRef.current?.showModal();
  };

  const trackDemoDayAccess = (userInfo: IUserInfo | null) => {
    if (userInfo?.email) {
      onAccessDeniedUserNotWhitelistedModalShown({ userEmail: userInfo.email });

      const event: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_USER_NOT_WHITELISTED_MODAL_SHOWN,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          reason: 'user_not_whitelisted',
        },
      };
      reportAnalytics.mutate(event);
    } else {
      onAccessDeniedModalShown();

      const event: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_MODAL_SHOWN,
        distinctId: 'anonymous',
        properties: {
          path: '/demoday',
          timestamp: new Date().toISOString(),
          reason: 'no_user_access',
        },
      };
      reportAnalytics.mutate(event);
    }
  };

  useEffect(() => {
    function handleInvalidEmail(errorType: AuthErrorCode) {
      if (errorType) {
        router.refresh();

        // Special handling for demo day rejected access
        if (pathname === '/demoday' && errorType === 'rejected_access_level') {
          const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

          setContent({
            title: 'Access Denied',
            errorMessage: "Your email isn't on our Protocol Labs Demo Day invite list yet. Request access below.",
            description: INVITE_FORM_URL,
            variant: 'access_denied_demo_day',
          });

          trackDemoDayAccess(userInfo);
        } else if (ERROR_CONTENT[errorType]) {
          setContent(ERROR_CONTENT[errorType]);
        }
      }

      handleModalOpen();
    }

    const unsubscribe = authEvents.on('auth:invalid-email', handleInvalidEmail);
    return unsubscribe;
  }, [pathname, onAccessDeniedModalShown, onAccessDeniedUserNotWhitelistedModalShown, reportAnalytics, router]);

  return <VerifyEmailModal dialogRef={dialogRef} content={content} handleModalClose={handleModalClose} />;
}
