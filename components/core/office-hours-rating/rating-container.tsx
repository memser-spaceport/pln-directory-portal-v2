'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '../modal';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRecentBookedOfficeHours } from '@/services/common.service';
import { OFFICE_HOURS_STEPS } from '@/utils/constants';
import UserConfirmation from './user-confirmation';
import cookies from 'js-cookie';
import NotHappened from './not-happened';
import Happened from './happened';
import { getFollowUps } from '@/services/office-hours.service';
import { IUserInfo } from '@/types/shared.types';

interface IRatingContainer {
  isLoggedIn: boolean;
  authToken: string;
  userInfo: IUserInfo;
}

const RatingContainer = (props: IRatingContainer) => {
  const ratingContainerRef = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentFollowup, setCurrentFollowup] = useState<any>({});
  const [remainingFollowups, setRemainingFollowups] = useState([]);
  const [currentStep, setCurrentStep] = useState('');

  const isLoggedIn = props?.isLoggedIn ?? false;

  const authToken = props?.authToken ?? '';
  const userInfo = props?.userInfo ?? {};

  const onCloseClickHandler = () => {
    if(remainingFollowups.length > 0) {
      const currentFollowup: any = remainingFollowups[0];
      setCurrentStep(currentFollowup?.type);
      setCurrentFollowup(currentFollowup);
      const filteredFollowups = [...remainingFollowups]?.filter((fp: any) => fp.uid !== currentFollowup.uid)
      setRemainingFollowups([...filteredFollowups]);
      return;
    }

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
      console.log("current folowups is", currentFollowup);
      setCurrentStep(currentFollowup.type);
      setCurrentFollowup(currentFollowup);
      const filteredFollowups = result?.filter((fp: any) => fp.uid !== currentFollowup.uid)
      setRemainingFollowups(filteredFollowups);
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


  useEffect(() => {
    console.log('parent -----', currentFollowup)
  },[currentFollowup])

  const hasOneHourPassed = (storedTime: number) => {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - storedTime;
    const oneHourInMilliseconds = 3600000;
    return timeDifference > oneHourInMilliseconds;
  };


  return (
    <>
      <Modal modalRef={ratingContainerRef} onClose={onCloseClickHandler}>
        {currentStep === OFFICE_HOURS_STEPS.MEETING_INITIATED.name && <UserConfirmation userInfo={userInfo} setCurrentStep={setCurrentStep} currentFollowup={currentFollowup} />}
        {currentStep === OFFICE_HOURS_STEPS.NOT_HAPPENED.name && <NotHappened onClose={onCloseClickHandler} />}
        {currentStep === OFFICE_HOURS_STEPS.HAPPENED.name && <Happened recentlyBooked={currentFollowup} onClose={onCloseClickHandler} />}
      </Modal>
    </>
  );
};

export default RatingContainer;
