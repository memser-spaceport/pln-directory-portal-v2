'use client';

import { IIrlCard } from '@/types/irl.types';
import { ADMIN_ROLE, INVITE_ONLY_RESTRICTION_ERRORS } from '@/utils/constants';
import { isPastDate } from '@/utils/irl.utils';
import { useRef } from 'react';
import { IUserInfo } from '@/types/shared.types';
import { IrlInviteOnlyUnauthorized } from './irl-invite-only-unauthorized';
import Modal from '@/components/core/modal';
import { IrlInviteOnlyLoggedOut } from './irl-invite-only-logged-out';
import IrlCard from './irl-card';
import Link from 'next/link';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

interface IIrlList {
  conference: any;
  userEvents: string[];
  userInfo: IUserInfo;
}

export default function IrlList(props: IIrlList) {
  //props
  const conference = props.conference;
  const userEvents = props.userEvents;
  const user = props?.userInfo;

  //variable
  const pastEvents = conference?.filter((item: any) => isPastDate(item.endDate)) ?? [];
  const upcomingEvents = conference?.filter((item: any) => !isPastDate(item.endDate)) ?? [];

  const inviteOnlyRef = useRef<HTMLDialogElement>(null);
  const inviteOnlyLogOutRef = useRef<HTMLDialogElement>(null);
  const analytics = useIrlAnalytics();

  //methods
  const onCardClick = (event: any, item: any) => {
    triggerLoader(true);
    const isPastEvent = isPastDate(item.endDate);
    const isInviteOnly = item.type === 'INVITE_ONLY';

    if (isInviteOnly && !user.email) {
      triggerLoader(false);
      event.preventDefault();
      if (inviteOnlyLogOutRef.current) {
        inviteOnlyLogOutRef.current.showModal();
        analytics.irlCardClicked(getAnalyticsUserInfo(user), {
          uid: item.id,
          name: item.name,
          slugUrl: item.slugUrl,
          isInviteOnly,
          isPastEvent,
          restrictedReason: INVITE_ONLY_RESTRICTION_ERRORS.NOT_LOGGED_IN,
        });
      }
    } else if (isInviteOnly && !userEvents.includes(item.id) && user.roles && !user.roles.includes(ADMIN_ROLE)) {
      triggerLoader(false);
      event.preventDefault();
      if (inviteOnlyRef.current) {
        event.preventDefault();
        inviteOnlyRef.current.showModal();
        analytics.irlCardClicked(getAnalyticsUserInfo(user), {
          uid: item.id,
          name: item.name,
          slugUrl: item.slugUrl,
          isInviteOnly,
          isPastEvent,
          restrictedReason: INVITE_ONLY_RESTRICTION_ERRORS.UNAUTHORIZED,
        });
      }
    }

    analytics.irlCardClicked(getAnalyticsUserInfo(user), {
      uid: item.id,
      name: item.name,
      slugUrl: item.slugUrl,
      isInviteOnly,
      isPastEvent,
    });
  };

  const onCloseInviteOnlyModal = () => {
    if (inviteOnlyRef.current) {
      inviteOnlyRef.current.close();
    }
  };

  const onCloseInviteOnlyLoggedoutModal = () => {
    if (inviteOnlyLogOutRef.current) {
      inviteOnlyLogOutRef.current.close();
    }
  };

  return (
    <>
      <div className="irlList">
        <div className="irlList__upcoming">
          <h2 className="irlList__upcoming__title">Current & Upcoming Gatherings</h2>
          <div className="irlList__upcoming__events">
            {upcomingEvents.length > 0 ? (
              upcomingEvents?.map((item: any, index: number) => {
                return (
                  <Link className="irlCard" key={`irl-upcomin-evnt-${index}`} href={`/irl/${item.slugUrl}`} onClick={(e) => onCardClick(e, item)}>
                    <IrlCard {...item} />
                  </Link>
                );
              })
            ) : (
              <p>No events available</p>
            )}
          </div>
        </div>

        {pastEvents.length > 0 && (
          <div className="irlList__past">
            <h2 className="irlList__past__title">Past Gatherings</h2>
            <div className="irlList__past__events">
              {pastEvents?.map((item: any, index: number) => (
                <Link key={index} href={`/irl/${item.slugUrl}`} onClick={(e) => onCardClick(e, item)}>
                  <IrlCard {...item} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="">
        <Modal modalRef={inviteOnlyRef} onClose={onCloseInviteOnlyModal}>
          <IrlInviteOnlyUnauthorized onClose={onCloseInviteOnlyModal} />
        </Modal>
        <Modal modalRef={inviteOnlyLogOutRef} onClose={onCloseInviteOnlyLoggedoutModal}>
          <IrlInviteOnlyLoggedOut onClose={onCloseInviteOnlyLoggedoutModal} />
        </Modal>
      </div>

      <style jsx>
        {`
          .irlList {
            width: 100%;
            height: 100%;
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            gap: 34px;
            margin: auto;
          }

          .irlList__upcoming {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 16px;
            width: 100%;
          }

          .irlList__upcoming__events {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
            width: 100%;
          }

          .irlList__past {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex-wrap: wrap;
            // justify-content: flex-start;
            gap: 16px;
            width: 100%;
          }

          .irlList__past__title,
          .irlList__upcoming__title {
            width: 100%;
            font-weight: 700;
            font-size: 18px;
            line-height: 20px;
            color: #0f172a;
            padding-left: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #cbd5e1;
          }

          .irlList__past__events {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
            width: 100%;
          }

          .irlList__modal {
            width: 656px;
            height: 196px;
          }

          @media (min-width: 1024px) {
            .irlList {
              padding: 24px 0;
              gap: 24px;
            }

            .irlList__upcoming__events {
              justify-content: flex-start;
              align-items: flex-start;
            }

            .irlList__past__title,
            .irlList__upcoming__title {
              font-size: 28px;
              line-height: 40px;
              padding-left: 0;
            }

            .irlList__past__events {
              justify-content: flex-start;
            }
          }
        `}
      </style>
    </>
  );
}
