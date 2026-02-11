'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useRouter } from 'next/navigation';

import s from './AccountCreatedSuccessModal.module.scss';
import { DemoDayState } from '@/app/actions/demo-day.actions';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isNew: boolean | undefined;
  uid: string | undefined;
  email: string | undefined;
  demoDayState: DemoDayState | undefined;
  userInfo?: IUserInfo | null;
}

const CheckboxIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 0C10.4288 0 7.91543 0.762437 5.77759 2.1909C3.63975 3.61935 1.97351 5.64968 0.989572 8.02512C0.0056327 10.4006 -0.251811 13.0144 0.249797 15.5362C0.751405 18.0579 1.98953 20.3743 3.80762 22.1924C5.6257 24.0105 7.94208 25.2486 10.4638 25.7502C12.9856 26.2518 15.5995 25.9944 17.9749 25.0104C20.3503 24.0265 22.3807 22.3603 23.8091 20.2224C25.2376 18.0846 26 15.5712 26 13C25.9964 9.5533 24.6256 6.24882 22.1884 3.81163C19.7512 1.37445 16.4467 0.00363977 13 0ZM18.7075 10.7075L11.7075 17.7075C11.6146 17.8005 11.5043 17.8742 11.3829 17.9246C11.2615 17.9749 11.1314 18.0008 11 18.0008C10.8686 18.0008 10.7385 17.9749 10.6171 17.9246C10.4957 17.8742 10.3854 17.8005 10.2925 17.7075L7.29251 14.7075C7.10486 14.5199 6.99945 14.2654 6.99945 14C6.99945 13.7346 7.10486 13.4801 7.29251 13.2925C7.48015 13.1049 7.73464 12.9994 8.00001 12.9994C8.26537 12.9994 8.51987 13.1049 8.70751 13.2925L11 15.5863L17.2925 9.2925C17.3854 9.19959 17.4957 9.12589 17.6171 9.07561C17.7385 9.02532 17.8686 8.99944 18 8.99944C18.1314 8.99944 18.2615 9.02532 18.3829 9.07561C18.5043 9.12589 18.6146 9.19959 18.7075 9.2925C18.8004 9.38541 18.8741 9.49571 18.9244 9.6171C18.9747 9.7385 19.0006 9.86861 19.0006 10C19.0006 10.1314 18.9747 10.2615 18.9244 10.3829C18.8741 10.5043 18.8004 10.6146 18.7075 10.7075Z" fill="#1B4DFF"/>
  </svg>
);


const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3334 4L6.00008 11.3333L2.66675 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AccountCreatedSuccessModal: React.FC<Props> = ({ isOpen, onClose, isNew, uid, email, demoDayState, userInfo }) => {
  const router = useRouter();
  const { onAccountCreatedSuccessModalContinueToLoginClicked } = useDemoDayAnalytics();
  const isLoggedIn = !!userInfo;

  const handleContinueToLogin = () => {
    onAccountCreatedSuccessModalContinueToLoginClicked({
      isNew,
      memberUid: uid,
      email,
      demoDaySlug: demoDayState?.slugURL,
      demoDayTitle: demoDayState?.title,
    });

    if (isLoggedIn) {
      onClose();
      router.push(`/members/${uid}`);
    } else {
      onClose();
      router.replace(
        `${window.location.origin}${window.location.pathname}?prefillEmail=${encodeURIComponent(email ?? '')}&returnTo=members-${uid}#login`,
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} overlayClassname={s.overlay}>
      <div className={s.modal}>
        <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={s.content}>
          <div className={s.icon}>
            <CheckboxIcon />
          </div>

          <div className={s.text}>
            <h2 className={s.title}>
               Thank you for applying 
               <br /> to Demo Day!
            </h2>

            <div className={s.steps}>
              {/* Step 0: Completed */}
              <div className={s.step}>
                <div className={s.stepIndicator}>
                  <div className={s.lineTop} />
                  <div className={s.stepIconCompleted}>
                    <CheckIcon />
                  </div>
                  <div className={s.lineBottom} />
                </div>
                <div className={s.stepContent}>
                  <p className={s.stepTitle}>Application submitted successfully!</p>
                  <p className={s.stepDescription}>Our team will review your application shortly.</p>
                </div>
              </div>

              {/* Break line */}
              <div className={s.breakLine} />

              {/* Step 1: Pending */}
              <div className={s.step}>
                <div className={s.stepIndicator}>
                  <div className={s.lineTop} />
                  <div className={s.stepIconPending}>
                    <div className={s.stepDot} />
                  </div>
                  <div className={s.lineBottom} />
                </div>
                {isNew ? (
                  <div className={s.stepContent}>
                    <p className={s.stepTitle}>Set up investor profile</p>
                    <p className={s.stepDescription}>
                      Complete your investor profile: founders see this when you&apos;re introduced.
                    </p>
                  </div>
                ) : (
                  <div className={s.stepContent}>
                    <p className={s.stepTitle}>Review your investor profile (optional)</p>
                    <p className={s.stepDescription}>
                      Keep your information up-to-date; founders see this when you&apos;re introduced.
                    </p>
                  </div>
                ) }
              </div>

              {/* Break line */}
              <div className={s.breakLine} />

              {/* Step 2: Pending */}
              <div className={s.step}>
                <div className={s.stepIndicator}>
                  <div className={s.lineTop} />
                  <div className={s.stepIconPending}>
                    <div className={s.stepDot} />
                  </div>
                  <div className={s.lineBottomHidden} />
                </div>
                <div className={s.stepContent}>
                  <p className={s.stepTitle}>Await approval confirmation</p>
                
                  <p className={s.stepDescription}>
                    You&apos;ll receive an email confirmation if our team approves your Demo Day application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={s.footer}>
          <Button
            type="button"
            size="m"
            style="fill"
            variant="primary"
            onClick={handleContinueToLogin}
            className={s.primaryButton}
          >
            {isNew ? 'Log In To Set Up Investor Profile' : isLoggedIn ? 'Review Investor Profile' : 'Log In To Review Investor Profile'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
