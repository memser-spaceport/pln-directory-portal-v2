import { Tooltip } from '@/components/core/tooltip/tooltip';
import { formatDateRange, getTelegramUsername, removeAt } from '@/utils/irl.utils';
import Link from 'next/link';
import GuestDescription from './guest-description';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

const GuestTableRow = (props: any) => {
  const guest = props?.guest;
  const userInfo = props.userInfo;
  const isExclusionEvent = props?.isExclusionEvent;
  const showTelegram = props?.showTelegram;
  const eventDetails = props?.eventDetails;

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

  const isUserGoing = guestUid === userInfo?.uid;
  const topicsNeedToShow = 2;
  const formattedDate = formatDateRange(checkInDate, checkOutDate);
  const remainingTopics = topics?.slice(topicsNeedToShow, topics?.length)?.map((topic: any) => topic);
  const atRemovedTelegram = removeAt(getTelegramUsername(telegramId));

  const analytics = useIrlAnalytics();

  const onTeamClick = (teamUid: string, teamName: string) => {
    analytics.guestListTeamClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails), {
      teamUid,
      teamName,
    });
  };

  const onMemberClick = (memberUid: string, memberName: string) => {
    analytics.guestListMemberClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails), {
      memberUid,
      memberName,
    });
  };

  const onTelegramClick = (telegramUrl: string, memberUid: string, memberName: string) => {
    analytics.guestListTelegramClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), telegramUrl, memberUid, memberName });
  };

  const handleOfficeHoursLinkClick = (officeHoursLink: string, memberUid: string, memberName: string) => {
    analytics.guestListOfficeHoursClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), memberUid, officeHoursLink, memberName });
  };

  const handleAddOfficeHoursClick = () => {
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          isOHFocused: true,
        },
      })
    );
    analytics.guestListOfficeHoursAddClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
  };

  return (
    <>
      <div className={`gtr ${isUserGoing ? 'user__going' : ''}`}>
        <div className="gtr__guestName">
          <Link passHref legacyBehavior href={`/members/${guestUid}`}>
            <a title={guestName} target="_blank" className="gtr__guestName__li" onClick={() => onMemberClick(guestUid, guestName)}>
              <div className="gtr__guestName__li__imgWrpr">
                <img width={32} height={32} alt="member image" src={guestLogo} loading="lazy" className="gtr__guestName__li__img" />
              </div>
              <div className="gtr__guestName__li__txtWrpr">
                <div className="gtr__guestName__li__txt ">{guestName}</div>
              </div>
            </a>
          </Link>
        </div>
        <div className="gtr__team">
          <Link passHref legacyBehavior href={`/teams/${teamUid}`}>
            <a target="_blank" title={teamName} className="gtr__team__link" onClick={() => onTeamClick(teamUid, teamName)}>
              <div className="gtr__team__link__imgWrpr">
                <img width={32} height={32} alt="team logo" src={teamLogo} loading="lazy" />
              </div>
              <div className="break-word">{teamName}</div>
            </a>
          </Link>
        </div>
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
        {isExclusionEvent && (
          <div className="gtr__date">
            <span className="gtr__date__txt">{formattedDate}</span>
          </div>
        )}
        <div className="gtr__connect">
          {!showTelegram && userInfo.uid === guestUid ? (
            <Tooltip
              asChild
              align="start"
              content={<div className="gtr__connect__pvtTel__tp">Change your privacy settings to display</div>}
              trigger={
                <div className="gtr__connect__pvtTel">
                  <img onClick={(e) => e.preventDefault()} className="cursor-default" src="/icons/telegram-eye.svg" alt="telegram-hidden" loading="lazy" />
                  <span className="gtr__connect__pvtTel__txt">Hidden from others</span>
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
            <button onClick={handleAddOfficeHoursClick} className="gtr__connect__add">
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
            <Link passHref legacyBehavior href={officeHours}>
              <a className="gtr__connect__book" target="_blank" onClick={() => handleOfficeHoursLinkClick(officeHours, guestUid, guestName)}>
                <img src="/icons/video-cam.svg" height={16} width={16} loading="lazy" alt="cam" />
                <span className="gtr__connect__book__txt">Book Time</span>
              </a>
            </Link>
          ) : null}
        </div>
      </div>
      <style jsx>{`
        .gtr {
          display: flex;
          width: fit-content;
          padding: 12px 20px;
          font-size: 13px;
          font-weight: 400;
        }

        .gtr__guestName {
          display: flex;
          width: 160px;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
          padding-right: 16px;
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

        .gtr__team {
          display: flex;
          width: 160px;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
        }

        .gtr__team__link {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
        }

        .gtr__team__link__imgWrpr {
          height: 32px;
          width: 32px;
          min-width: 32px;
          background: #e2e8f0;
          border-radius: 4px;
        }

        .gtr__topic {
          display: flex;
          width: 340px;
          flex-direction: column;
          justify-content: flex-start;
          gap: 4px;
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
          background-color: #1e293b;
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
          overflow: auto;
          border-radius: 8px;
          background-color: #1e293b;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: white;
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
          width: 170px;
          flex-direction: column;
          gap: 4px;
        }

        .gtr__connect__pvtTel__tp {
          word-break: break-word;
          max-width: 200px;
          border-radius: 8px;
          background-color: #1e293b;
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
          background-color: #1e293b;
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
        }

        .gtr__connect__book__txt {
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          color: #475569;
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