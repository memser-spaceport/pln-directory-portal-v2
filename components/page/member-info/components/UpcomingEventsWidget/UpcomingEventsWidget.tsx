'use client';

import React from 'react';
import Image from 'next/image';

import s from './UpcomingEventsWidget.module.scss';
import clsx from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { FloatingWidgets } from '@/components/page/member-info/components/FloatingWidgets';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';
import { format } from 'date-fns-tz';
import { useUpcomingEvents } from '@/services/events/hooks/useUpcomingEvents';
import Link from 'next/link';
import { useMemberNotificationsSettings } from '@/services/members/hooks/useMemberNotificationsSettings';
import { useEventsAnalytics } from '@/analytics/events.analytics';

interface Props {
  userInfo: IUserInfo;
}

export const UpcomingEventsWidget = ({ userInfo }: Props) => {
  const [open, setOpen] = useLocalStorageParam('upcoming-events-widget', true);

  const { data, isLoading } = useUpcomingEvents();
  const { data: settings } = useMemberNotificationsSettings(userInfo?.uid);
  const { onUpcomingEventsWidgetShowAllClicked } = useEventsAnalytics();

  if (!userInfo || isLoading || !data?.length || !settings?.subscribed) {
    return null;
  }

  return (
    <FloatingWidgets
      className={clsx(s.container, {
        [s.open]: open,
      })}
    >
      <div
        className={clsx(s.root, {
          [s.open]: open,
        })}
      >
        <div className={clsx(s.top, {})}>
          <Link
            href={'/events'}
            className={s.mainTitle}
            onClick={() => {
              onUpcomingEventsWidgetShowAllClicked();
            }}
          >
            Upcoming Events <ArrowIcon />
          </Link>
          <button onClick={() => setOpen(!open)} className={s.toggleBtn}>
            <ChevronDownIcon />
          </button>
        </div>
        {open ? (
          <div className={s.content}>
            <ul className={s.list}>
              {data.map((item) => {
                try {
                  const from = new Date(item.startDate);
                  const to = new Date(item.endDate);

                  const _from = format(from, 'MMM d');
                  const _to = format(to, 'd');
                  const _year = format(to, 'yy');

                  return (
                    <Link key={item.uid} className={s.event} href={item.websiteUrl ?? ''} target="_blank">
                      {item.logo ? <Image width={30} height={30} alt={item.name} src={item.logo ?? ''} className={s.eventImage} /> : <DefaultEventImage />}
                      <div className={s.details}>
                        <div className={s.name}>{item.name}</div>
                        <div className={s.info}>
                          {_from}-{_to}&apos;{_year} -&nbsp;
                          {item.flag && <Image src={item.flag ?? ''} width={16} height={16} alt={item.location} />}
                          &nbsp;{item.location}
                        </div>
                      </div>
                      <ArrowIcon />
                    </Link>
                  );
                } catch (e) {
                  console.error(e);

                  return null;
                }
              })}
            </ul>
          </div>
        ) : (
          <div className={s.desc}>Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem</div>
        )}
      </div>
    </FloatingWidgets>
  );
};

const ArrowIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 'auto' }}>
    <path
      d="M0.84375 8.93359C0.953125 9.07031 1.11719 9.125 1.28125 9.125C1.47266 9.125 1.63672 9.07031 1.74609 8.93359L8.0625 2.61719V7.59375C8.0625 7.97656 8.36328 8.25 8.71875 8.25C9.10156 8.25 9.375 7.97656 9.375 7.59375V1.03125C9.375 0.675781 9.10156 0.375 8.71875 0.375H2.15625C1.80078 0.375 1.5 0.675781 1.5 1.03125C1.5 1.41406 1.80078 1.6875 2.15625 1.6875H7.16016L0.84375 8.00391C0.570312 8.27734 0.570312 8.6875 0.84375 8.93359Z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className={s.chevron} width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.3125 1.49219L5.53516 6.49609C5.69922 6.63281 5.86328 6.6875 6 6.6875C6.16406 6.6875 6.32812 6.63281 6.46484 6.52344L11.7148 1.49219C11.9883 1.24609 11.9883 0.808594 11.7422 0.5625C11.4961 0.289062 11.0586 0.289062 10.8125 0.535156L6 5.12891L1.21484 0.535156C0.96875 0.289062 0.53125 0.289062 0.285156 0.5625C0.0390625 0.808594 0.0390625 1.24609 0.3125 1.49219Z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

const DefaultEventImage = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.eventImage}>
    <rect width="30" height="30" rx="8" fill="#156FF7" fillOpacity="0.1" />
    <path
      d="M18.0938 8.625C20.375 10.7188 22 14.1562 22 15.8125C22 19.7812 18.8438 23 15 23C11.125 23 8 19.7812 8 15.8125C8 13.5625 10.1562 9.875 13.25 7C14.4375 8.125 15.5 9.3125 16.3438 10.5C16.875 9.84375 17.4375 9.21875 18.0938 8.625ZM15 21.5C18.0312 21.5 20.5 18.9688 20.5 15.8125C20.5 14.8438 19.5 12.5625 18.0625 10.7812C17.875 11 17.6875 11.2188 17.5 11.4375L16.2812 12.9375L15.125 11.375C14.5938 10.625 13.9375 9.84375 13.25 9.125C10.875 11.6562 9.5 14.4062 9.5 15.8125C9.5 18.9688 11.9688 21.5 15 21.5ZM17.7812 14.625C17.9062 14.8125 18 14.9688 18.0938 15.1562C18.8438 16.5938 18.5312 18.4062 17.1875 19.3438C16.5938 19.7812 15.8438 20 15.0625 20C13.0938 20 11.5 18.7188 11.5 16.5938C11.5 15.5312 12.1562 14.5938 13.4688 13C13.6562 13.2188 16.1875 16.4375 16.1875 16.4375L17.7812 14.625Z"
      fill="#156FF7"
    />
  </svg>
);
