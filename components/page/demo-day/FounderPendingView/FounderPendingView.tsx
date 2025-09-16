import React from 'react';
import s from './FounderPendingView.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { Alert } from './components/Alert';
import { ProfileSection } from './components/ProfileSection';
import { TeamFundraisingCard } from '@/components/page/demo-day/InvestorPendingView/components/TeamFundraisingCard';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';

export const FounderPendingView = () => {
  const { data } = useGetDemoDayState();

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
        <div className={s.content}>
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
            <p className={s.description}>{data?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>
          </div>

          <ProfileContent
            pitchDeckUrl={
              'https://pl-events-service.s3.us-west-1.amazonaws.com/uploads/none/none/slide/9e581647b9e8e4363fa8fe5c84385bc2718b2859.pdf?AWSAccessKeyId=AKIAQGFDYLGEJQNXPQHT&Expires=1758016807&Signature=5itRtZQIty%2FtSZT61YY4b5tBNsA%3D'
            }
            videoUrl={
              'https://pl-events-service.s3.us-west-1.amazonaws.com/uploads/none/none/video/aa123a09916a91b56e6c13aeae6340abe1350434.mp4?AWSAccessKeyId=AKIAQGFDYLGEJQNXPQHT&Expires=1758017055&Signature=A2QvHhfuCU3CawaH%2BhJIazdxcEM%3D'
            }
          />
        </div>
      </div>

      <Alert />

      <ProfileSection />
    </div>
  );
};
