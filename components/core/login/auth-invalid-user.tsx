import { useEffect, useRef, useState } from 'react';
import { VerifyEmailModal } from './verify-email-modal';
import { triggerLoader, getParsedValue } from '@/utils/common.utils';
import { usePathname, useRouter } from 'next/navigation';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';

function AuthInvalidUser() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Analytics hooks
  const { onAccessDeniedModalShown, onAccessDeniedUserNotWhitelistedModalShown } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const [content, setContent] = useState({
    title: 'Email Verification',
    errorMessage: 'Email not available',
    description: 'Your email is either invalid or not available in our directory. Please try again with valid email.',
    variant: 'regular',
  });

  const handleModalClose = () => {
    triggerLoader(false);
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    setTimeout(() => {
      setContent({
        title: 'Email Verification',
        errorMessage: 'Email not available',
        description:
          'Your email is either invalid or not available in our directory. Please try again with valid email.',
        variant: 'regular',
      });
    }, 500);
  };

  const handleModalOpen = () => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  useEffect(() => {
    function handleInvalidEmail(e: CustomEvent) {
      if (e?.detail) {
        router.refresh();
        if (pathname === '/demoday' && e.detail === 'rejected_access_level') {
          const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

          setContent({
            title: 'Access Denied',
            errorMessage: "Your email isn't on our Protocol Labs Demo Day invite list yet. Request access below.",
            description:
              'https://docs.google.com/forms/d/1c_djy7MnO-0k89w1zdFnBKF6GLdYKKWUvLTDBjxd114/viewform?edit_requested=true',
            variant: 'access_denied_demo_day',
          });

          // Track access denied modal shown for logged-in user not whitelisted
          if (userInfo?.email) {
            onAccessDeniedUserNotWhitelistedModalShown({ userEmail: userInfo.email });

            const modalShownEvent: TrackEventDto = {
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

            reportAnalytics.mutate(modalShownEvent);
          } else {
            // Track access denied modal shown for non-logged-in user
            onAccessDeniedModalShown();

            const modalShownEvent: TrackEventDto = {
              name: DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_MODAL_SHOWN,
              distinctId: 'anonymous',
              properties: {
                path: '/demoday',
                timestamp: new Date().toISOString(),
                reason: 'no_user_access',
              },
            };

            reportAnalytics.mutate(modalShownEvent);
          }
        } else if (e.detail === 'linked_to_another_user') {
          setContent({
            title: 'Email Verification',
            errorMessage: 'Email already used. Connect social account for login',
            description:
              'The email you provided is already used or linked to another account. If this is your email id, then login with the email id and connect this social account in profile settings page. After that you can use any of your linked accounts for subsequent logins.',
            variant: 'regular',
          });
        } else if (e.detail === 'unexpected_error') {
          setContent({
            title: 'Something went wrong',
            errorMessage:
              'We are unable to authenticate you at the moment due to technical issues. Please try again later',
            description: '',
            variant: 'regular',
          });
        } else if (e.detail === 'rejected_access_level') {
          setContent({
            title: 'Access rejected',
            errorMessage: 'Your application to join the Protocol Labs network was not approved.',
            description:
              'Your application to join the Protocol Labs network was not approved. You may reapply in the future.',
            variant: 'regular',
          });
        }
        // } else if (e.detail === 'email-changed') {
        //   setContent({ title: 'Email Changed recently', errorMessage: 'Your email in our directory has been changed recently. Please login with your updated email id.', description: '' });
        // }
      }
      handleModalOpen();
    }
    document.addEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    return function () {
      document.removeEventListener('auth-invalid-email', handleInvalidEmail as EventListener);
    };
  }, [pathname, onAccessDeniedModalShown, onAccessDeniedUserNotWhitelistedModalShown, reportAnalytics, router]);

  return (
    <>
      <VerifyEmailModal dialogRef={dialogRef} content={content} handleModalClose={handleModalClose} />
    </>
  );
}

export default AuthInvalidUser;
