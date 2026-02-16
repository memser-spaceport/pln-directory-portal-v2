'use client';

import { useToggle } from 'react-use';
import { ReactNode, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { getUserInfo } from '@/utils/cookie.utils';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { authEvents, AuthErrorCode, isDemoDayScopePage } from '../../../utils/authEvents';
import { ModalBase } from '@/components/common/ModalBase';
import { Button } from '@/components/common/Button';
import { useContactSupportContext } from '@/components/ContactSupport/context/ContactSupportContext';
import { WarningCircleIcon } from '@/components/icons';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import s from './AuthInvalidUser.module.scss';

interface ModalContent {
  title: string;
  description: string;
  reason: string;
  submit?: {
    label: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  footer?: ReactNode;
}

const ERROR_CONTENT: Record<string, ModalContent> = {
  linked_to_another_user: {
    title: 'Email Verification',
    description:
      'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
    reason: 'linked_to_another_user',
  },
  unexpected_error: {
    title: 'Something Went Wrong',
    description:
      "We couldn't complete your request due to a technical issue. Please try again or contact our support team for help.",
    reason: 'unexpected_error',
  },
  rejected_access_level: {
    title: 'Access Denied',
    description:
      'Your application to join the Protocol Labs was not approved. You may reapply in the future. If you believe this was a mistake, please contact our support team.',
    reason: 'rejected_access_level',
  },
  email_not_found: {
    title: 'Email Not Found',
    description:
      "We couldn't find any user with this email in the system. Double-check your email or try a different one. If you believe this is an error, our support team can help.",
    reason: 'email_not_found',
  },
};

const DEFAULT_CONTENT: ModalContent = ERROR_CONTENT.unexpected_error;

/**
 * AuthInvalidUser - Handles auth error modal display
 *
 * Listens for 'auth-invalid-email' events and shows appropriate error modals.
 * Special handling for demo day access denied scenarios.
 */
export function AuthInvalidUser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { data: demoDayState } = useGetDemoDayState();
  const [open, toggleOpen] = useToggle(false);
  const { openModal } = useContactSupportContext();

  const { onAccessDeniedModalShown, onAccessDeniedUserNotWhitelistedModalShown } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const [content, setContent] = useState<ModalContent>(DEFAULT_CONTENT);

  const handleModalClose = () => {
    triggerLoader(false);
    toggleOpen(false);
    setTimeout(() => setContent(DEFAULT_CONTENT), 500);
  };

  const handleModalOpen = () => {
    toggleOpen(true);
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
        if (
          errorType === 'no_demo_day_access' ||
          (isDemoDayScopePage(pathname) &&
            ['REGISTRATION_OPEN', 'ACTIVE'].includes(demoDayState?.status) &&
            ['rejected_access_level', 'email_not_found'].includes(errorType))
        ) {
          const userInfo: IUserInfo = getUserInfo();
          const demoDaySlug = demoDayState?.slugURL || params.demoDayId;

          const demoDayTitle = demoDayState?.title || 'Demo Day';
          const description = !userInfo
            ? `Your email isn't on our Protocol Labs ${demoDayTitle} invite list yet. Apply below to create an account and request access. If you believe this is an error, our support team can help.`
            : `You have an account with us, but you're not registered for ${demoDayTitle} yet. Each demo day requires a separate application. Apply below or contact our support team if you believe this is an error.`;

          setContent({
            title: 'Access Denied',
            description,
            reason: 'access_denied',
            submit: {
              label: 'Apply',
              onClick: () => {
                handleModalClose();
                router.push(demoDaySlug ? `/demoday/${demoDaySlug}?dialog=applyToDemoday` : '/demoday');
              },
            },
            footer: (
              <div style={{ textAlign: 'center' }}>
                <Button
                  style="link"
                  onClick={() => {
                    handleModalClose();
                    openModal({ reason: 'demo_day_access_denied' });
                  }}
                >
                  Contact Support
                </Button>
              </div>
            ),
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
  }, [
    pathname,
    onAccessDeniedModalShown,
    onAccessDeniedUserNotWhitelistedModalShown,
    reportAnalytics,
    router,
    demoDayState,
    params.demoDayId,
    handleModalClose,
    handleModalOpen,
    openModal,
    trackDemoDayAccess,
  ]);

  return (
    <ModalBase
      className={s.root}
      title={content.title}
      titleIcon={<WarningCircleIcon />}
      description={content.description}
      cancel={{
        onClick: handleModalClose,
      }}
      submit={
        content.submit
          ? content.submit
          : {
              label: 'Contact Support',
              onClick: () => {
                handleModalClose();
                openModal({ reason: content.reason });
              },
            }
      }
      open={open}
      footer={content.footer}
    />
  );
}
