import React from 'react';
import s from './InvestorPendingView.module.scss';
import { useRouter } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { InvestorStepper } from './components/InvestorStepper';

export const InvestorPendingView = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const router = useRouter();
  const { data } = useGetDemoDayState();

  const handleFillProfile = () => {
    if (!userInfo) {
      return;
    }

    router.push(`/members/${userInfo.uid}`);
  };

  // Format the date from the API data
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    return { time, day, month, year };
  };

  const eventDate = data?.date
    ? formatEventDate(data.date)
    : {
        time: '19:00',
        day: '25',
        month: 'Oct',
        year: '2025',
      };

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        {/* Main content */}
        <div className={s.content}>
          <div className={s.mainContent}>
            {/* Date and time section */}
            <div className={s.dateSection}>
              <div className={s.dateContainer}>
                <span className={s.dateLabel}>Date:</span>
                <span className={s.timeValue}>{eventDate.time}</span>
                <div className={s.divider} />
                <span className={s.dateValue}>{eventDate.day}</span>
                <div className={s.divider} />
                <span className={s.dateValue}>{eventDate.month}</span>
                <div className={s.divider} />
                <span className={s.dateValue}>{eventDate.year}</span>
              </div>
            </div>

            {/* Headline section */}
            <div className={s.headline}>
              <h1 className={s.title}>{data?.title || 'PL Demo Day'}</h1>
              <p className={s.description}>
                {data?.description ||
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
              </p>
            </div>
          </div>

          <InvestorStepper currentStep={2} eventDate={eventDate} onFillProfile={handleFillProfile} />
        </div>
      </div>
    </div>
  );
};
