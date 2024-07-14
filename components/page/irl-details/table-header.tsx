import useFloatingMultiSelect from '@/hooks/irl/use-floating-multi-select';
import { getTopics, getUniqueRoles } from '@/utils/irl.utils';
import { useState } from 'react';
import FloatingMultiSelect from './floating-multi-select';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

const TableHeader = (props: any) => {
  const isUserLoggedIn = props.isUserLoggedIn ?? false;
  const eventDetails = props?.eventDetails;
  const sortConfig = props?.sortConfig;
  const userInfo = props?.userInfo;

  const analytics = useIrlAnalytics();
  // const user = getUserInfo();

  const roles = getUniqueRoles([...eventDetails?.guests]);
  const topics = getTopics([...eventDetails?.guests]);
  const [roleFilterItems, setRoleFilterItems] = useState([]);
  const [topicFilterItems, setTopicFilterItems] = useState([]);

  const roleFilterProps = useFloatingMultiSelect({
    items: roles,
    selectedItems: roleFilterItems,
  });

  const topicFilterProps = useFloatingMultiSelect({
    items: topics,
    selectedItems: topicFilterItems,
  });

  // sort columns
  const onSort = (key: string) => {
    analytics.guestListSortClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), column: key });

    document.dispatchEvent(
      new CustomEvent('irl-details-sortlist', {
        detail: {
          sortColumn: key,
        },
      })
    );
  };

  //get updated sort icon
  const getSortIcon = (column: string) => {
    if (sortConfig.key === column) {
      if (sortConfig.order === 'asc') {
        return '/icons/sort-asc-blue.svg';
      } else if (sortConfig.order === 'desc') {
        return '/icons/sort-desc-blue.svg';
      } else {
        return '/icons/sort-grey.svg';
      }
    } else {
      return '/icons/sort-grey.svg';
    }
  };

  //filter column by topics
  const onFilterByTopics = (items: any, from: string) => {
    if (from !== 'reset') {
      analytics.guestListFilterApplyClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), column: 'topics', filterValues: items });
    }

    document.dispatchEvent(
      new CustomEvent('irl-details-filterList', {
        detail: {
          key: 'topics',
          selectedItems: items,
        },
      })
    );
    setTopicFilterItems(items);
    topicFilterProps?.onClosePane();
    topicFilterProps?.setFilteredItems(topics);
  };

  //clear topic filter
  const onClearTopicFilter = (e: any) => {
    document.dispatchEvent(
      new CustomEvent('irl-details-filterList', {
        detail: {
          key: 'topics',
          selectedItems: [],
        },
      })
    );
    setTopicFilterItems([]);
    topicFilterProps?.onClearSelection(e);
  };

  const onTopicsFilterclicked = () => {
    analytics.guestListFilterBtnClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), column: 'topics' });
    topicFilterProps?.onOpenPane();
    roleFilterProps?.onClosePane();
  };

  return (
    <>
      {isUserLoggedIn && (
        <div className="tbl__hdr">
          <div className="tbl__hdr__guestName">
            <div onClick={() => onSort('memberName')} className="tbl__hdr__guestName__txt">
              <img src={getSortIcon('memberName')} alt="sort" width={16} height={16} />
              Attendee Name
            </div>
          </div>
          <div className="tbl__hdr__teams">
            <div className="tbl__hdr__teams__txt" onClick={() => onSort('teamName')}>
              <img src={getSortIcon('teamName')} alt="sort" width={16} height={16} />
              Team
            </div>
          </div>
          <div className="tbl__hdr__topics">
            Topics you are interested in
            {topics?.length > 0 && (
              <>
                <div className="tbl__hdr__topics__filter">
                  <button className="tbl__hdr__topics__filter__btn" onClick={onTopicsFilterclicked}>
                    <img width={16} height={16} src="/icons/filter-blue.svg" alt="filter" />
                  </button>
                  {topicFilterItems?.length > 0 && (
                    <div className="tbl__hdr__topics__filter__tag">
                      {topicFilterItems?.length}
                      <button className="tbl__hdr__topics__filter__tag__btn" onClick={onClearTopicFilter}>
                        <img width={10} height={10} src="/icons/close-white.svg" alt="count" />
                      </button>
                    </div>
                  )}
                </div>
                {topicFilterProps?.isPaneActive && (
                  <div className="tbl__hdr__topics__multiselect">
                    <FloatingMultiSelect {...topicFilterProps} items={topics} onFilter={onFilterByTopics} />
                  </div>
                )}
              </>
            )}
          </div>
          {eventDetails?.isExclusionEvent && <div className="tbl__hdr__dates">{`Date(s) Attending`}</div>}
          <div className="tbl__hdr__connect">Connect</div>
        </div>
      )}
      {!isUserLoggedIn && (
        <div className="hideInMobile tbl__hdr__lo">
          <div className="tbl__hdr__lo__team">Team</div>
          <div className="tbl__hdr__lo__guestName">Attendee Name</div>
          {eventDetails?.isExclusionEvent && <div className="tbl__hdr__lo__dates">{`Date(s) Attending`}</div>}
          <div className="tbl__hdr__lo__dates__topics">Topics you are interested in</div>
          <div className="tbl__hdr__lo__dates__connect">Connect</div>
        </div>
      )}
      {!isUserLoggedIn && (
        <div className="hideInDesktop tbl__hdr__lo">
          <div className="tbl__hdr__lo__team">Team</div>
        </div>
      )}
      <style jsx>
        {`
          .tbl__hdr {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            height: 42px;
            width: fit-content;
            border-radius: 8px 8px 0xp 0px;
            border-bottom: 1px solid #64748b;
            background-color: white;
            padding: 0px 20px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .tbl__hdr__guestName {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__teams {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__dates {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
          }

          .tbl__hdr__connect {
            display: flex;
            width: 170px;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
          }

          .tbl__hdr__guestName__txt {
            display: flex;
            cursor: pointer;
            align-items: center;
            gap: 0.25rem;
          }

          .tbl__hdr__teams__txt {
            display: flex;
            cursor: pointer;
            align-items: center;
            gap: 0.25rem;
          }

          .tbl__hdr__topics {
            position: relative;
            display: flex;
            width: 340px;
            align-items: center;
            justify-content: flex-start;
            gap: 10px; /* Gap of 10 pixels */
          }

          .tbl__hdr__topics__filter {
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .tbl__hdr__topics__filter__tag {
            display: flex;
            height: 18px;
            align-items: center;
            gap: 2px;
            border-radius: 36px;
            background-color: #156ff7;
            padding-left: 8px;
            padding-right: 8px;
            color: white;
          }

          .tbl__hdr__topics__filter__btn,
          .tbl__hdr__topics__filter__tag__btn {
            background: transparent;
            display: flex;
          }

          .tbl__hdr__topics__multiselect {
            position: absolute;
            top: 33px;
            left: 0;
            width: 238px;
          }

          .tbl__hdr__lo {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            height: 42px;
            width: calc(100% - 2px);
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            border-bottom: 1px solid #64748b;
            background-color: white;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .tbl__hdr__lo__team {
            display: flex;
            width: 200px;
            align-items: center;
            justify-content: flex-start;
            padding-left: 20px;
          }

          .tbl__hdr__lo__guestName {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__lo__dates {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__lo__dates__topics {
            display: flex;
            width: 340px;
            align-items: center;
            justify-content: flex-start;
            padding-right: 20px;
          }

          .tbl__hdr__lo__dates__connect {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding-right: 20px;
          }

          .hideInMobile {
            display: none;
          }
          .hideInDesktop {
            display: flex;
          }
          @media (min-width: 1024px) {
            .tbl__hdr {
              width: calc(100% - 2px);
            }

            .hideInMobile {
              display: flex;
            }
            .hideInDesktop {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default TableHeader;
