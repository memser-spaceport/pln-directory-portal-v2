'use client';

import { getFollowUps } from '@/services/office-hours.service';
import { IUserInfo } from '@/types/shared.types';
import { EVENTS, OFFICE_HOURS_STEPS } from '@/utils/constants';
import cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Modal from '../modal';
import RegsiterFormLoader from '../register/register-form-loader';
import Happened from './happened';
import NotHappened from './not-happened';
import UserConfirmation from './user-confirmation';
import { IFollowUp } from '@/types/officehours.types';

interface IRatingContainer {
  isLoggedIn: boolean;
  authToken: string;
  userInfo: IUserInfo;
}

const RatingContainer = (props: IRatingContainer) => {
  const ratingContainerRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentFollowup, setCurrentFollowup] = useState<IFollowUp | null>(null);
  const [currentStep, setCurrentStep] = useState('');

  const isLoggedIn = props?.isLoggedIn ?? false;
  const authToken = props?.authToken ?? '';
  const userInfo = props?.userInfo ?? {};

  const onCloseClickHandler = () => {
    setCurrentFollowup(null);
    setCurrentStep('');
    document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: true }));
    router.refresh();
    if (ratingContainerRef?.current) {
      ratingContainerRef.current.close();
    }
  };

  const getRecentBooking = async () => {
    const response = await getFollowUps(userInfo.uid ?? '', authToken);
    const result = response?.data ?? [];
    cookies.set('lastRatingCall', new Date().getTime().toString());
    if (result?.length) {
      const currentFollowup = result[0];
      setCurrentStep(currentFollowup.type);
      setCurrentFollowup(currentFollowup);
      if (ratingContainerRef?.current) {
        ratingContainerRef.current.showModal();
      }
    }
  };

  useEffect(() => {
    try {
      if (isLoggedIn) {
        const storedTime = cookies.get('lastRatingCall') ?? '';
        const storedTimeParsed = parseInt(storedTime, 10);
        if (!storedTime) {
          getRecentBooking();
          return;
        } else if (hasOneHourPassed(storedTimeParsed)) {
          getRecentBooking();
        }
      } else {
        cookies.remove('lastRatingCall');
      }
    } catch (error) {
      console.error(error);
    }
  }, [router, searchParams]);

  const hasOneHourPassed = (storedTime: number) => {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - storedTime;
    const oneHourInMilliseconds = 3600000;
    return timeDifference > oneHourInMilliseconds;
  };

  useEffect(() => {
    async function updateNotification(notification: IFollowUp) {
      setCurrentStep(notification.type);
      setCurrentFollowup(notification);
      if (ratingContainerRef?.current) {
        ratingContainerRef.current.showModal();
      }
    }

    document.addEventListener(EVENTS.TRIGGER_RATING_POPUP, (e: any) => {
      updateNotification(e?.detail?.notification);
    });

    return () => {
      document.removeEventListener(EVENTS.TRIGGER_RATING_POPUP, (e: any) => {
        updateNotification(e?.detail?.notification);
      });
    };
  }, []);

  return (
    <>
      <Modal modalRef={ratingContainerRef} onClose={onCloseClickHandler}>
        <RegsiterFormLoader />
        {currentStep === OFFICE_HOURS_STEPS.MEETING_INITIATED.name && (
          <UserConfirmation authToken={authToken} onClose={onCloseClickHandler} userInfo={userInfo} setCurrentStep={setCurrentStep} currentFollowup={currentFollowup} />
        )}
        {currentStep === OFFICE_HOURS_STEPS.NOT_HAPPENED.name && <NotHappened authToken={authToken} userInfo={userInfo} onClose={onCloseClickHandler} currentFollowup={currentFollowup} />}
        {(currentStep === OFFICE_HOURS_STEPS.MEETING_SCHEDULED.name || currentStep === OFFICE_HOURS_STEPS.MEETING_RESCHEDULED.name) && (
          <Happened authToken={authToken} userInfo={userInfo} currentFollowup={currentFollowup} onClose={onCloseClickHandler} />
        )}
      </Modal>
    </>
  );
};

export default RatingContainer;
