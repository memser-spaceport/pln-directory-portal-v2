'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useGetDemoDayStats } from '@/services/demo-day/hooks/useGetDemoDayStats';
import { NumberTicker } from '@/components/ui/NumberTicker';
import s from './DemoDayStats.module.scss';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';

const HandshakeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.75 13C14.75 13.1989 14.671 13.3897 14.5303 13.5303C14.3897 13.671 14.1989 13.75 14 13.75H2C1.80109 13.75 1.61032 13.671 1.46967 13.5303C1.32902 13.3897 1.25 13.1989 1.25 13V3C1.25 2.80109 1.32902 2.61032 1.46967 2.46967C1.61032 2.32902 1.80109 2.25 2 2.25C2.19891 2.25 2.38968 2.32902 2.53033 2.46967C2.67098 2.61032 2.75 2.80109 2.75 3V9.1875L5.46938 6.4675C5.53905 6.39758 5.62185 6.3421 5.71301 6.30425C5.80417 6.26639 5.90191 6.24691 6.00063 6.24691C6.09934 6.24691 6.19708 6.26639 6.28824 6.30425C6.3794 6.3421 6.4622 6.39758 6.53188 6.4675L8 7.9375L10.6875 5.25H10C9.80109 5.25 9.61032 5.17098 9.46967 5.03033C9.32902 4.88968 9.25 4.69891 9.25 4.5C9.25 4.30109 9.32902 4.11032 9.46967 3.96967C9.61032 3.82902 9.80109 3.75 10 3.75H12.5C12.6989 3.75 12.8897 3.82902 13.0303 3.96967C13.171 4.11032 13.25 4.30109 13.25 4.5V7C13.25 7.19891 13.171 7.38968 13.0303 7.53033C12.8897 7.67098 12.6989 7.75 12.5 7.75C12.3011 7.75 12.1103 7.67098 11.9697 7.53033C11.829 7.38968 11.75 7.19891 11.75 7V6.3125L8.53063 9.5325C8.46095 9.60242 8.37815 9.6579 8.28699 9.69575C8.19583 9.73361 8.09809 9.75309 7.99937 9.75309C7.90066 9.75309 7.80292 9.73361 7.71176 9.69575C7.6206 9.6579 7.5378 9.60242 7.46812 9.5325L6 8.0625L2.75 11.3125V12.25H14C14.1989 12.25 14.3897 12.329 14.5303 12.4697C14.671 12.6103 14.75 12.8011 14.75 13Z"
      fill="#1B4DFF"
    />
  </svg>
);

export const DemoDayStats: React.FC = () => {
  const pathname = usePathname();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Check if we're on a demo day related page (including prep page)
  const isDemoDayPage = pathname?.startsWith('/demoday');

  const { data } = useGetDemoDayState();
  const { data: stats } = useGetDemoDayStats(isDemoDayPage && data?.status === 'ACTIVE' && !!userInfo?.uid);

  // Don't render if not on demo day page or no data or no access
  if (!isDemoDayPage || !data || data.access === 'none' || data.status !== 'ACTIVE' || (stats?.total ?? 0) < 500) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.content}>
        <div className={s.stat}>
          <div className={s.iconWrapper}>
            <HandshakeIcon />
          </div>
          <NumberTicker value={stats?.total ?? 0} className={s.value} />
        </div>
        <div className={s.label}>intros made</div>
      </div>
    </div>
  );
};
