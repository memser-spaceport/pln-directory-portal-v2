import Link from 'next/link';
import cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

import {  getParsedValue } from '@/utils/common.utils';
import { canUserPerformAction, getFormattedDateString, getTelegramUsername, removeAt } from '@/utils/irl.utils';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { createFollowUp, getFollowUps } from '@/services/office-hours.service';
import GuestDescription from './guest-description';
import { Tooltip as Popover } from './attendee-popover';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import EventSummary from './event-summary';

const GuestTableRow = (props: any) => {
  const guest = props?.guest;
  const userInfo = props?.userInfo;
  const showTelegram = props?.showTelegram;
  const onchangeSelectionStatus = props?.onchangeSelectionStatus;
  const selectedGuests = props?.selectedGuests;

  const guestUid = guest?.memberUid;
  const guestName = guest?.memberName ?? '';
  const guestLogo = guest?.memberLogo || '/icons/default-user-profile.svg';
  const teamUid = guest?.teamUid ?? '';
  const teamName = guest?.teamName ?? '';
  const teamLogo = guest?.teamLogo || '/icons/team-default-profile.svg';
  const reason = guest?.reason;
  const topics = guest?.topics ?? [];
  const checkInDate = guest?.additionalInfo?.checkInDate;
  const checkOutDate = guest?.additionalInfo?.checkOutDate;
  const telegramId = guest?.telegramId;
  const officeHours = guest?.officeHours;
  const hostEvents = guest?.hostSubEvents ?? [];
  const speakerEvents = guest?.speakerSubEvents ?? [];
  const events = guest?.events ?? [];
  const formattedEventRange = getFormattedDateString(checkInDate, checkOutDate);

  const router = useRouter();

  const isUserGoing = guestUid === userInfo?.uid;
  const topicsNeedToShow = 2;
  const remainingTopics = topics?.slice(topicsNeedToShow, topics?.length)?.map((topic: any) => topic);
  const atRemovedTelegram = removeAt(getTelegramUsername(telegramId));
  const analytics = useIrlAnalytics();
  const canUserAddAttendees = canUserPerformAction(userInfo.roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const onTeamClick = (teamUid: string, teamName: string) => {
    analytics.trackGuestListTableTeamClicked(location, {
      teamUid,
      teamName,
    });
  };

  const onMemberClick = (memberUid: string, memberName: string) => {
    analytics.trackGuestListTableMemberClicked(location, {
      memberUid,
      memberName,
    });
  };

  const onTelegramClick = (telegramUrl: string, memberUid: string, memberName: string) => {
    analytics.trackGuestListTableTelegramLinkClicked(location, { telegramUrl, memberUid, memberName });
  };

  const handleOfficeHoursLinkClick = async (officeHoursLink: string, memberUid: string, memberName: string) => {
    analytics.trackGuestListTableOfficeHoursLinkClicked(location, { memberUid, officeHoursLink, memberName });

    const isLoggedInUser = userInfo?.uid === memberUid;
    try {
      const authToken = cookies.get('authToken') || '';
      const response: any = await createFollowUp(userInfo.uid, getParsedValue(authToken), {
        data: {},
        hasFollowUp: true,
        type: 'SCHEDULE_MEETING',
        targetMemberUid: memberUid,
      });

      if (response?.error) {
        if (response?.error?.status === 403) {
          toast.error(TOAST_MESSAGES.INTERACTION_RESTRICTED);
        }
        return;
      }
      window.open(officeHours, '_blank');
      const allFollowups = await getFollowUps(userInfo.uid ?? '', getParsedValue(authToken), 'PENDING,CLOSED');
      if (!allFollowups?.error) {
        const result = allFollowups?.data ?? [];
        if (result.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: result[0] } }));
          document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }));
          router.refresh();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOfficeHoursClick = (uid: string) => {
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          isOHFocused: true,
          type: canUserAddAttendees ? 'admin-edit' : 'self-edit',
          selectedGuest: uid,
        },
      })
    );
    analytics.trackGuestListTableAddOfficeHoursClicked(location);
  };

  return (
    <>
      <div className={`gtr ${isUserGoing ? 'user__going' : ''}`}>
        {/* Team */}
        <div className="gtr__team">
          {canUserAddAttendees && (
            <div className="gtr__guestName__checkbox">
              {selectedGuests.includes(guest?.memberUid) && (
                <button onClick={() => onchangeSelectionStatus(guest?.memberUid)} className="notHappenedCtr__bdy__optnCtr__optn__sltd">
                  <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                </button>
              )}
              {!selectedGuests.includes(guest?.memberUid) && <button className="notHappenedCtr__bdy__optnCtr__optn__ntsltd" onClick={() => onchangeSelectionStatus(guest.memberUid)}></button>}
            </div>
          )}
          <Link passHref legacyBehavior href={`/teams/${teamUid}`}>
            <a target="_blank" className="gtr__team__link" onClick={() => onTeamClick(teamUid, teamName)}>
              <div className="gtr__team__link__imgWrpr">
                <img title={teamName} className="gtr__team__link__img" width={32} height={32} alt="team logo" src={teamLogo} loading="lazy" />
              </div>
              <div>
                <div title={teamName} className="break-word">
                  {teamName}
                </div>
                {hostEvents?.length > 0 && (
                  <button
                    onClick={(e: any) => {
                      e.preventDefault();
                    }}
                    className="gtr__team__host__btn"
                  >
                    Host
                  </button>
                )}
              </div>
            </a>
          </Link>
        </div>
        {/* Name */}
        <div className="gtr__guestName">
          <Link passHref legacyBehavior href={`/members/${guestUid}`}>
            <a target="_blank" className="gtr__guestName__li" onClick={() => onMemberClick(guestUid, guestName)}>
              <div className="gtr__guestName__li__imgWrpr">
                <img title={guestName} width={32} height={32} alt="member image" src={guestLogo} loading="lazy" className="gtr__guestName__li__img" />
              </div>
              <div className="gtr__guestName__li__txtWrpr">
                <div title={guestName} className="gtr__guestName__li__txt ">
                  {guestName}
                </div>
                <div className="gtr__guestName__li__info">
                  {speakerEvents?.length > 0 && (
                    <div className="gtr__guestName__li__info__spkr">
                      <Popover
                        asChild
                        align="end"
                        content={
                          <div className="gtr__guestName__li__info__spkr__list">
                            {speakerEvents.map((event: any, index: number) => (
                              <a key={index} target="_blank" href={event?.link} className="gtr__guestName__li__info__spkr__list__item">
                                {event?.name}
                                <img src="/icons/arrow-blue.svg" alt="arrow" width={9} height={9} />
                              </a>
                            ))}
                          </div>
                        }
                        trigger={
                          <button
                            onClick={(e: any) => {
                              e.preventDefault();
                            }}
                            className="gtr__guestName__li__info__spkr__btn"
                          >
                            Speaker <img src="/icons/down-arrow-white.svg" alt="arrow" />
                          </button>
                        }
                      />
                    </div>
                  )}
                  {hostEvents?.length > 0 && (
                    <div className="gtr__guestName__li__info__host">
                      <Popover
                        asChild
                        align="end"
                        content={
                          <div className="gtr__guestName__li__info__host__list">
                            {hostEvents?.map((event: any, index: number) => (
                              <a key={index} target="_blank" href={event?.link} className="gtr__guestName__li__info__host__list__item">
                                {event?.name}
                                <img src="/icons/arrow-blue.svg" alt="arrow" width={9} height={9} />
                              </a>
                            ))}
                          </div>
                        }
                        trigger={
                          <button
                            onClick={(e: any) => {
                              e.preventDefault();
                            }}
                            className="gtr__guestName__li__info__host__btn"
                          >
                            Host <img src="/icons/down-arrow-white.svg" alt="arrow" />
                          </button>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </a>
          </Link>
        </div>
        {/* Attending */}
        <div className="gtr__attending">
          <div className="gtr__attending__cn">
            <div className="gtr__attending__cn__date">{formattedEventRange}</div>
            <div className="gtr__attending__cn__evnt">
              <EventSummary events={events} />
            </div>
          </div>
        </div>
        {/* Topics */}
        <div className="gtr__topic">
          <GuestDescription description={reason} />
          <div className="gtr__topic__tags">
            {topics?.slice(0, topicsNeedToShow).map((topic: any, index: number) => (
              <Tooltip
                key={`${topic}-${index}`}
                asChild
                align="start"
                content={<div className="gtr__topic__tag_tp">{topic}</div>}
                trigger={
                  <div key={`topic-${index}`} className="gtr__topic__tag">
                    {topic}
                  </div>
                }
              />
            ))}
            {topics?.length > topicsNeedToShow && (
              <Tooltip
                asChild
                content={
                  <div className="gtr__topic__tags__re__tp">
                    {remainingTopics.map((topic: string, index: any) => (
                      <span className="break-word" key={`${topic} + ${index}`}>
                        {topic}
                        {index !== remainingTopics.length - 1 ? ',' : ''}
                        <br />
                      </span>
                    ))}
                  </div>
                }
                align="start"
                side="bottom"
                trigger={<span className="gtr__topic__tags__re">{`+${topics?.length - topicsNeedToShow}`}</span>}
              />
            )}
          </div>
        </div>
        {/* {isExclusionEvent && (
          <div className="gtr__date">
            <span className="gtr__date__txt">{formattedDate}</span>
          </div>
        )} */}
        {/* Connect */}
        <div className="gtr__connect">
          {!showTelegram && userInfo.uid === guestUid ? (
            <Tooltip
              asChild
              align="start"
              content={<div className="gtr__connect__pvtTel__tp">Change your privacy settings to display</div>}
              trigger={
                <div className="gtr__connect__pvtTel">
                  <img onClick={(e) => e.preventDefault()} className="cursor-default" src="/icons/telegram-eye.svg" alt="telegram-hidden" loading="lazy" />
                  <span className="gtr__connect__pvtTel__txt">Hidden from public</span>
                </div>
              }
            />
          ) : telegramId ? (
            <span className="gtr__connect__tel">
              <img onClick={(e) => e.preventDefault()} className="cursor-default" src="/icons/telegram-solid.svg" alt="telegram" />
              <a
                target="_blank"
                title={telegramId}
                href={`https://t.me/${atRemovedTelegram}`}
                className="gtr__connect__tel__li"
                onClick={(e) => {
                  e.stopPropagation();
                  onTelegramClick(telegramId, guestUid, guestName);
                }}
                rel="noreferrer"
              >
                @{atRemovedTelegram}
              </a>
            </span>
          ) : (
            <span onClick={(e) => e.preventDefault()} className="empty">
              -
            </span>
          )}
          {userInfo.uid === guestUid && !officeHours ? (
            <button onClick={() => handleAddOfficeHoursClick(canUserAddAttendees ? guest.uid : userInfo.uid)} className="gtr__connect__add">
              <img loading="lazy" src="/icons/add-rounded.svg" height={16} width={16} alt="plus" />
              <span className="gtr__connect__add__txt">Add Office Hours</span>
              <Tooltip
                asChild
                align="start"
                content={
                  <div className="gtr__connect__add__info">
                    Please share your calendar link to facilitate scheduling for in-person meetings during the conference. Updating your availability for the conference week allows others to book time
                    with you for face-to-face connections.
                  </div>
                }
                trigger={<img style={{ display: 'flex' }} loading="lazy" src="/icons/info.svg" height={16} width={16} alt="plus" />}
              />
            </button>
          ) : userInfo.uid !== guestUid && officeHours ? (
            <div className="gtr__connect__book" onClick={() => handleOfficeHoursLinkClick(officeHours, guestUid, guestName)}>
              <img src="/icons/video-cam.svg" height={16} width={16} loading="lazy" alt="cam" />
              <span className="gtr__connect__book__txt">Book Time</span>
            </div>
          ) : null}
        </div>
      </div>
      <style jsx>{`
        .gtr {
          display: flex;
          width: fit-content;
          padding: 12px 8px 12px 20px;
          font-size: 13px;
          font-weight: 400;
        }

        .gtr__guestName {
          display: flex;
          width: 180px;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          padding-right: 8px;
        }

        .gtr__guestName__li {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
        }

        .gtr__guestName__li__imgWrpr {
          height: 32px;
          width: 32px;
          border-radius: 58px;
        }

        .gtr__guestName__li__img {
          border-radius: 58px;
          background-color: #e5e7eb;
          object-fit: cover;
        }

        .gtr__guestName__li__txtWrpr {
          display: flex;
          flex: 1;
          flex-direction: column;
          word-break: break-word;
          gap: 2px;
        }

        .gtr__guestName__li__txt {
          font-size: 13px;
          line-height: 20px;
          color: #000000;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          -webkit-line-clamp: 2;
        }

        .gtr__guestName__li__info {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .gtr__guestName__li__info__spkr {
          position: relative;
        }

        .gtr__guestName__li__info__spkr__btn {
          background: linear-gradient(97.17deg, #4fb68b 6.23%, #46b9cb 99.44%);
          border: 1px solid #ffffff66;
          height: 20px;
          padding: 0px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 600;
          line-height: 20px;
          color: #ffffff;
          border-radius: 4px;
        }

        .gtr__guestName__li__info__spkr__list,
        .gtr__guestName__li__info__host__list {
          width: 130px;
          border: 1px solid #cbd5e1;
          background-color: #f5f9ff;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 10px;
          border-radius: 4px;
          max-height: 200px;
          overflow: auto;
        }

        .gtr__guestName__li__info__spkr__list__item,
        .gtr__guestName__li__info__host__list__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 400;
          line-height: 18px;
          text-align: left;
          color: #000000;
        }

        .gtr__guestName__li__info__host__btn {
          background: linear-gradient(97.17deg, #9e7eff 6.23%, #e58eff 99.44%);
          border: 1px solid #ffffff66;
          height: 20px;
          padding: 0px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 600;
          line-height: 20px;
          color: #ffffff;
          border-radius: 4px;
        }

        .gtr__team__host__btn {
          background: linear-gradient(97.17deg, #9e7eff 6.23%, #e58eff 99.44%);
          border: 1px solid #ffffff66;
          height: 20px;
          padding: 0px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 600;
          line-height: 20px;
          color: #ffffff;
          border-radius: 4px;
        }

        .gtr__team {
          display: flex;
          width: 150px;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
        }

        .gtr__team__link {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
          padding-right: 8px;
        }

        .gtr__team__link__imgWrpr {
          height: 32px;
          width: 32px;
          min-width: 32px;
          background: #e2e8f0;
          border-radius: 4px;
        }

        .gtr__team__link__img {
          border-radius: 4px;
          object-fit: cover;
        }

        .gtr__attending {
          width: 200px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding-right: 8px;
        }

        .gtr__attending__cn__evnt {
          height: 20px;
        }

        .gtr__attending__cn__date {
          font-size: 10px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .gtr__topic {
          display: flex;
          width: 205px;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 4px;
          padding-right: 8px;
        }

        .gtr__topic__tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }

        .gtr__topic__tag_tp {
          word-break: break-word;
          padding: 2px 8px;
          max-width: 200px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .gtr__topic__tag {
          word-break: break-word;
          max-width: 250px;
          display: flex;
          align-items: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          background-color: #f1f5f9;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
        }

        .gtr__topic__tags__re__tp {
          max-height: 250px;
          max-width: 200px;
          // overflow: auto;
          border-radius: 8px;
          background-color: #1e293b;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          background: transparent;
        }

        .gtr__topic__tags__re {
          display: flex;
          height: 20px;
          cursor: default;
          align-items: center;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          background-color: #f1f5f9;
          padding-left: 8px;
          padding-right: 8px;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
        }

        .gtr__date {
          width: 160px;
        }

        .gtr__date__txt {
          display: flex;
          height: 100%;
          align-items: center;
          font-size: 13px;
          line-height: 1.5rem;
          color: #0f172a;
        }

        .gtr__connect {
          display: flex;
          width: 132px;
          flex-direction: column;
          gap: 4px;
        }

        .gtr__connect__pvtTel__tp {
          word-break: break-word;
          max-width: 200px;
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .gtr__connect__pvtTel {
          display: flex;
          align-items: center;
        }

        .gtr__connect__pvtTel__txt {
          font-weight: 400;
          font-size: 12px;
          line-height: 20px;
          color: #94a3b8;
        }

        .gtr__connect__tel {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .gtr__connect__tel__li {
          word-break: break-word;
          font-size: 12px;
          line-height: 20px;
          color: #156ff7;
        }

        .gtr__connect__add {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
        }

        .gtr__connect__add__txt {
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
        }

        .gtr__connect__add__info {
          word-break: break-word;
          max-width: 200px;
          border-radius: 8px;
          // background-color: #1e293b;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .gtr__connect__book {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          border: 0.5px solid #cbd5e1;
          background-color: #f1f5f9;
          padding: 4px 8px;
          cursor: pointer;
        }

        .gtr__connect__book__txt {
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
        }

        .notHappenedCtr__bdy__optnCtr__optn__sltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #156ff7;
        }

        .notHappenedCtr__bdy__optnCtr__optn__ntsltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: transparent;
        }

        .user__going {
          background: #fffae6;
        }

        .break-word {
          word-break: break-word;
        }

        .cursor-default {
          cursor: default;
        }

        .empty {
          cursor: default;
          color: #156ff7;
        }

        @media (min-width: 1024px) {
          .gtr {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default GuestTableRow;
