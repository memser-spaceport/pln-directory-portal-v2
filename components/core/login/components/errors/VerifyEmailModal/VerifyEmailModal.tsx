'use client';

import { RefObject } from 'react';
import Cookies from 'js-cookie';

import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';

import { RegularContent } from './components/RegularContent';
import { AccessDeniedContent } from './components/AccessDeniedContent';

import s from './VerifyEmailModal.module.scss';

interface VerifyEmailModalProps {
  handleModalClose: () => void;
  content: {
    title: string;
    errorMessage: string;
    description: string;
    variant: string;
  };
  dialogRef: RefObject<HTMLDialogElement>;
}

/**
 * VerifyEmailModal - Displays email verification errors
 *
 * Has two variants:
 * - 'regular': Standard error with title, message, and close button
 * - 'access_denied_demo_day': Demo day access denied with register CTA
 */
export function VerifyEmailModal(props: VerifyEmailModalProps) {
  const { content, handleModalClose, dialogRef } = props;
  const { title, errorMessage, description, variant } = content;

  const { onAccessDeniedRequestInviteClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const handleRequestInviteClick = () => {
    const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

    onAccessDeniedRequestInviteClicked({ userEmail: userInfo?.email || 'anonymous' });

    const event: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_ACCESS_DENIED_REQUEST_INVITE_CLICKED,
      distinctId: userInfo?.email || 'anonymous',
      properties: {
        userId: userInfo?.uid || null,
        userEmail: userInfo?.email || null,
        userName: userInfo?.name || null,
        path: '/demoday',
        timestamp: new Date().toISOString(),
        source: 'access_denied_modal',
      },
    };

    reportAnalytics.mutate(event);
  };

  const isAccessDenied = variant === 'access_denied_demo_day';

  return (
    <dialog onClose={handleModalClose} ref={dialogRef} className={s.dialog} data-testid="verify-email-modal">
      <div className={s.container}>
        <div className={s.box}>
          <div className={s.infoWrapper}>
            {isAccessDenied ? (
              <AccessDeniedContent
                errorMessage={errorMessage}
                description={description}
                onClose={handleModalClose}
                onRequestInvite={handleRequestInviteClick}
              />
            ) : (
              <RegularContent
                title={title}
                errorMessage={errorMessage}
                description={description}
                onClose={handleModalClose}
              />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
