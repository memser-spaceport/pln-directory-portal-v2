import { useEffect, useRef, useState } from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useRouter, useSearchParams } from 'next/navigation';
import useClickedOutside from '@/hooks/useClickedOutside';
import { IAnalyticsGuestLocation, IGuestDetails } from '@/types/irl.types';
import Search from './search';
import { triggerLoader } from '@/utils/common.utils';
import {Checkbox} from '@/components/common/Checkbox';
// import FollowButton from '../follow-gathering/follow-button';
interface IToolbar {
  onLogin: () => void;
  userInfo: IUserInfo;
  filteredListLength: number;
  isLoggedIn: boolean;
  eventDetails: IGuestDetails;
  location: IAnalyticsGuestLocation;
  isAdminInAllEvents: any;
  locationEvents: any;
  followers: any;
  handleAttendeesClick: (type: string, e: { stopPropagation: () => void }) => void;
}
const Toolbar = (props: IToolbar) => {
  //props
  const { handleAttendeesClick, eventDetails } = props;
  const location = props?.location;
  const filteredListLength = props?.filteredListLength ?? 0;
  //states
  // const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const router = useRouter();

  //hooks
  const analytics = useIrlAnalytics();

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  const updateQueryParams = debounce((value: string) => {
    triggerLoader(true);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    analytics.trackGuestListSearch(location, value);
  }, 300);
  const getValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event?.target?.value;
    updateQueryParams(searchValue?.trim());
  };

  const onCheckboxChange = () => {
    if (type === 'past') {
      handleAttendeesClick('upcoming', { stopPropagation: () => {} });
      analytics.trackShowOnlyCurrentAttendeesClicked(location);
    } else {
      handleAttendeesClick('past', { stopPropagation: () => {} });
      analytics.trackShowOnlyPastAttendeesCheckboxClicked(location);
    }
  };

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.value = search ?? '';
    }
  }, [router, searchParams]);

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__hdr">
          <span className="toolbar__hdr__count">
            {(eventDetails as any)?.upcomingCount === 0 || type === 'past' ? 'Past Attendees' : 'Current Attendees'}{` `}({filteredListLength})
          </span>
        </span>
        <div className="toolbar__search">
          <Search searchRef={searchRef} onChange={getValue} placeholder="Search by Attendee, Team or Project" />
        </div>
        {(eventDetails as any)?.upcomingCount > 0 && (eventDetails as any)?.pastCount > 0 && (
          <div className="toolbar__checkbox">
            <Checkbox checked={type === 'past' ? true : false} onChange={onCheckboxChange} />
            <p>Show Only Past Attendees</p>
          </div>
        )}
      </div>
      <style jsx>
        {`
          button {
            background: inherit;
            width: 100%;
          }
          .toolbar {
            display: flex;
            flex-direction: column;
            justify-content: ${(eventDetails as any)?.upcomingCount > 0 && (eventDetails as any)?.pastCount > 0 ? 'space-between' : ''};
            row-gap: 16px;
            padding: 16px 20px;
          }
          .toolbar__hdr {
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
          }
          .toolbar__left {
              display: flex;
              gap: 8px;
            }
          .toolbar__checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 400;
            color: rgba(71, 85, 105, 1);
            line-height: 20px;
            letter-spacing: 0;
          }
          .toolbar__search {
            width: 100%;
          }
          .toolbar__hdr {
            font-size: 18px;
            font-weight: 700;
            display: flex;
          }
          .toolbar__hdr__count {
            font-size: 14px;
            font-weight: 400;
            font-size: 18px;
            font-weight: 700;
            line-height: 20px;
            color: #0f172a;
          }
          .toolbar__actionCn {
            display: flex;
            // justify-content: flex-end;
            gap: 8px;
            width: auto;
          }
          .toolbar__actionCn__add {
            display: flex;
            align-items: center;
          }
          .toolbar__actionCn__download__btn {
            display: none;
          }
          .toolbar__actionCn__add__btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: 1px solid #cbd5e1;
            background: #fff;
            height: 40px;
            padding: 10px 12px;
            border-radius: 8px;
            justify-content: center;
          }
          .toolbar__actionCn__add__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #0f172a;
          }
          .toolbar__actionCn__download__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #0f172a;
          }
          .toolbar__actionCn__add__btn-mob {
            height: 40px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
          }
          .toolbar__actionCn__download__btn-mob {
            height: 40px;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
          }
          .toolbar__actionCn__add__btn__txt-mob {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #0f172a;
          }
          .toolbar__actionCn__schduleBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: white;
            color: #0f172a;
          }
          .toolbar__actionCn__imGoingBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
            width: 132px;
          }
          .toolbar__actionCn__imGoingBtn:hover {
            background: #1d4ed8;
          }
          .toolbar__actionCn__edit__wrpr {
            position: relative;
          }
          .toolbar__actionCn__edit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
          }
          .toolbar__actionCn__edit__list {
            position: absolute;
            z-index: 4;
            width: 207px;
            background: #fff;
            padding: 8px;
            border-radius: 12px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            margin-top: 4px;
            left: 0;
          }
          .toolbar__actionCn__edit__list__item {
            font-size: 14px;
            font-weight: 500;
            line-height: 28px;
            text-align: left;
            color: #0f172a;
            cursor: pointer;
            padding: 4px 8px;
            white-space: nowrap;
          }
          .toolbar__actionCn__edit__list__item:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          .toolbar__actionCn__edit:hover {
            background: #1d4ed8;
          }
          .toolbar__actionCn__login {
            display: none;
          }
          .toolbar__actionCn__login-mob {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            width: 320px;
            color: #fff;
          }

          @media (min-width: 360px) {
            .toolbar {
              display: flex;
              flex-direction: column;
              flex-wrap: wrap;
              gap: 12px;
            }
          .toolbar__hdr {
            flex: 1;
            align-items: center;
            order: 1; /* Current Attendees comes first */
          }
            .toolbar__actionCn {
              justify-content: flex-end;
              flex: unset;
            }
            .toolbar__checkbox {
              order: 2; /* Checkbox comes second */
            }
            .toolbar__search {
              width: 300px;
              flex-basis: unset;
              order: 3; /* Search comes last */
            }
            .toolbar__actionCn__edit__list {
              right: 0px;
              left: unset;
            }

            .toolbar__actionCn__webView,
            .toolbar__actionCn__webView__follCnt {
              display: none;
            }
          }
          @media (min-width: 692px) {
            .toolbar {
              flex-direction: row;
              flex-wrap: wrap;
            }
            .toolbar__hdr {
              order: 1; /* Current Attendees comes first */
            }
            .toolbar__search {
              width: 300px;
              flex-basis: unset;
              order: 2; /* Search comes second */
            }
            .toolbar__checkbox {
              order: 3; /* Checkbox comes last */
            }
          }
          @media (min-width: 1024px) {
            .toolbar__actionCn__webView,
            .toolbar__actionCn__webView__follCnt {
              display: flex;
            }

            .toolbar {
              flex-wrap: unset;
              justify-content: ${(eventDetails as any)?.upcomingCount > 0 && (eventDetails as any)?.pastCount > 0 ? 'space-between' : ''};
              align-items: center;
              padding: 0px;
              gap: 10px;
            }
            .toolbar__search {
              width: 300px;
              flex-basis: unset;
            }
            .toolbar__hdr {
              font-size: 20px;
              flex: unset;
            }
            .toolbar__hdr__count {
              min-width: 140px;
            }
            .toolbar__checkbox {
              margin-left: auto;
            }
            .toolbar__actionCn {
              flex: 1;
              justify-content: flex-end;
              order: 2;
            }
            .toolbar__actionCn__schduleBtn {
              width: unset;
            }
            .toolbar__actionCn__imGoingBtn {
              width: 95px;
              padding: 10px 12px;
            }
            .toolbar__actionCn__login {
              width: fit-content;
            }
            .toolbar__actionCn__download__btn {
              display: flex;
              align-items: center;
              gap: 4px;
              background: transparent;
              border: 1px solid #cbd5e1;
              background: #fff;
              height: 40px;
              padding: 10px 12px;
              border-radius: 8px;
            }
            .toolbar__actionCn__download__btn-mob {
              display: none;
            }
            .toolbar__actionCn__login-mob {
              display: none;
            }
            .toolbar__actionCn__login {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
              padding: 10px 24px;
              font-size: 14px;
              font-weight: 500;
              height: 40px;
              cursor: pointer;
              background: #156ff7;
              color: #fff;
            }
            .toolbar__actionCn__login:hover {
              background: #1d4ed8;
            }
          }
        `}
      </style>
    </>
  );
};
export default Toolbar;
