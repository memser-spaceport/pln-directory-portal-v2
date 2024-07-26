'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '../modal';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRecentBookedOfficeHours } from '@/services/common.service';
import { OFFICE_HOURS_STEPS } from '@/utils/constants';
import UserConfirmation from './user-confirmation';
import cookies from 'js-cookie';
import NotHappened from './not-happened';
import Happened from './happened';

interface IRatingContainer {
  isLoggedIn: boolean;
  authToken: string;
}

const RatingContainer = (props: IRatingContainer) => {
  const ratingContainerRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [recentlyBooked, setRecentlyBooked] = useState<any>();
  const [currentStep, setCurrentStep] = useState('');

  const isLoggedIn = props?.isLoggedIn ?? false;
  const authToken = props?.authToken ?? '';

  const onCloseClickHandler = () => {
    if (ratingContainerRef?.current) {
      ratingContainerRef.current.close();
    }
  };

  const getRecentBooking = async () => {
    const response = await getRecentBookedOfficeHours(authToken);
    const result = response?.data ?? [];
    cookies.set('lastRatingCall', new Date().getTime().toString());
    if (result?.length) {
      setRecentlyBooked(result);
      setCurrentStep(OFFICE_HOURS_STEPS.CONFIRMATION.name);
      if (ratingContainerRef?.current) {
        ratingContainerRef.current.showModal();
      }
    }
  };

  useEffect(() => {
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
  }, [router, searchParams]);



  const hasOneHourPassed = (storedTime: number) => {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - storedTime;
    const oneHourInMilliseconds = 3600000;
    return timeDifference > oneHourInMilliseconds;
  };

  return (
    <>
      <Modal modalRef={ratingContainerRef} onClose={onCloseClickHandler}>
        {currentStep === OFFICE_HOURS_STEPS.CONFIRMATION.name && <UserConfirmation setCurrentStep={setCurrentStep} recentlyBooked={recentlyBooked[0]} />}
        {currentStep === OFFICE_HOURS_STEPS.NOT_HAPPENED.name && <NotHappened onClose={onCloseClickHandler} />}
        {currentStep === OFFICE_HOURS_STEPS.HAPPENED.name && <Happened recentlyBooked={recentlyBooked[0]} onClose={onCloseClickHandler}/>}
      </Modal>
    </>
  );
};

export default RatingContainer;
