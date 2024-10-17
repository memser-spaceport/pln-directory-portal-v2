import Link from 'next/link';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';

interface IEmptyList {
  onLogin: () => void;
  items: IGuest[];
  eventDetails: IGuestDetails;
  location: IAnalyticsGuestLocation;
}

const EmptyList = (props: IEmptyList) => {
  const items = props?.items ?? [];
  const onLogin = props.onLogin;
  const analytics = useIrlAnalytics();
  const location = props?.location;

  const onLoginClick = () => {
    analytics.trackGuestListTableLoginClicked(location);
    onLogin();
  };

  const onTeamClick = (teamUid: string, teamName: string) => {
    analytics.trackGuestListTableTeamClicked(location, {
      teamUid,
      teamName,
    });
  };

  return (
    <>
      <div className="empList">
        {items?.map((item: IGuest, itemIndex: number) => (
          <div key={`${itemIndex}-event-list`} className="empList__item">
            <div className="empList__item__team">
              <Link passHref legacyBehavior href={`/teams/${item.teamUid}`}>
                <a target="_blank" className="empList__item__team__li text-clamp" onClick={() => onTeamClick(item?.teamUid, item?.teamName)}>
                  <span className="empList__item__team__liWrpr">
                    <div className="empList__item__team__li__imgWrpr">
                      <img src={item.teamLogo || '/icons/team-default-profile.svg'} height={32} width={32} />
                    </div>
                    <span style={{ width: 'fit-content' }}>{item.teamName}</span>
                  </span>
                </a>
              </Link>
            </div>
            <div className="empList__item__guestName">
              <div className="empList__item__guestName__img"></div>
              <p className="">aaaaaa aaa</p>
            </div>

            <div className="empList__item__attendings">aaaa aaaaaaa</div>
            <div className="empList__item__topic">aaaa aaaaaaa</div>
            <div className="empList__item__connect">@aaaaaaa</div>
          </div>
        ))}

        <div className="empList__layer">
          <div className="empList__layer__wrpr">
            <button onClick={onLoginClick} className="empList__layer__logBtn">
              Login To Access
            </button>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .empList {
            position: relative;
            display: flex;
            height: fit-content;
            width: 100%;
            flex-direction: column;
            padding-top: 8px;
            background: #fff;
          }

          .empList__item {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #cbd5e1;
            padding-top: 12px;
            padding-bottom: 12px;
            font-size: 13px;
            font-weight: 400;
          }

          .empList__item__team {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: flex-start;
            gap: 4px;
            padding-left: 20px;
          }

          .empList__item__team__li {
            width: fit-content;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .text-clamp {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
            -webkit-line-clamp: 2;
          }

          .empList__item__team__liWrpr {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .empList__item__team__li__imgWrpr {
            height: 32px;
            width: 32px;
            background: #e2e8f0;
            border-radius: 4px;
          }

          .empList__item__guestName {
            display: none;
          }

          .empList__item__guestName__img {
            height: 32px;
            width: 32px;
            border-radius: 58px;
            background-color: #e5e7eb;
          }

          .empList__item__topic {
            display: none;
          }

          .empList__item__connect {
            display: none;
          }

          .empList__item__attendings {
            display: none;
          }

          .empList__layer {
            position: absolute;
            top: 0px;
            right: 1px;
            bottom: 0;
            display: none;
            width: calc(100% - 160px);
            background-color: rgba(200, 200, 200, 0.6);
            backdrop-filter: blur(2.5px);
          }

          .empList__layer__wrpr {
            position: relative;
            display: flex;
            height: 100%;
            width: 100%;
            justify-content: center;
          }

          .empList__layer__logBtn {
            position: sticky;
            top: 50%;
            display: flex;
            height: 36px;
            width: 156px;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background-color: white;
            font-size: 14px;
            font-weight: 500;
          }

          @media (min-width: 1024px) {
            .empList__item__team {
              width: 160px;
              padding-right: 8px;
            }

            .empList__item__guestName {
              display: flex;
              width: 180px;
              align-items: center;
              justify-content: flex-start;
              gap: 4px;
            }

            .empList__item__attendings {
              display: flex;
              width: 200px;
              align-items: center;
              justify-content: flex-start;
            }

            .empList__item__topic {
              display: flex;
              width: 205px;
              align-items: center;
              justify-content: flex-start;
            }

            .empList__item__connect {
              display: flex;
              width: 128px;
              align-items: center;
              justify-content: flex-start;
              padding-right: 20px;
            }

            .empList__layer {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

export default EmptyList;
