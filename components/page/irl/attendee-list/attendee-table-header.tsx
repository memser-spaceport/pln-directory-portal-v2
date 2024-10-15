import useFloatingMultiSelect from '@/hooks/irl/use-floating-multi-select';
import { getTopics, getUniqueEvents } from '@/utils/irl.utils';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import FloatingMultiSelect from './floating-multi-select';
import { useSearchParams } from 'next/navigation';
interface IAttendeeTableHeader {
  isLoggedIn: boolean;
  eventDetails: any;
  sortConfig: { key: string; order: string };
  filterConfig: {
    events: string[];
    topics: string[];
  };
}

const AttendeeTableHeader = (props: IAttendeeTableHeader) => {
  const isUserLoggedIn = props.isLoggedIn ?? false;
  const eventDetails = props?.eventDetails;
  const sortConfig = props?.sortConfig;
  const filterConfig = props?.filterConfig;

  const analytics = useIrlAnalytics();
  const events = getUniqueEvents(eventDetails?.events);
  const topics = getTopics([...eventDetails?.guests]);
  const searchParams = useSearchParams();
  const eventType = searchParams.get('type');

  const eventsFilterProps = useFloatingMultiSelect({
    items: events,
    selectedItems: filterConfig?.events,
  });

  const topicFilterProps = useFloatingMultiSelect({
    items: topics,
    selectedItems: filterConfig?.topics,
  });

  // sort columns
  const onSort = (key: string) => {
    analytics.trackGuestListTableSortClicked(location, key);

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
  const onFilterByTopics = (items: string[], from: string) => {
    if (from !== 'reset') {
      analytics.trackGuestListTableFilterApplyClicked(location, { column: 'topics', filterValues: items });
    }

    document.dispatchEvent(
      new CustomEvent('irl-details-filterList', {
        detail: {
          key: 'topics',
          selectedItems: items,
        },
      })
    );
    // setTopicFilterItems(items);
    topicFilterProps?.onClosePane();
    topicFilterProps?.setFilteredItems(topics);
  };

  //filter column by events
  const onFilterByEvents = (items: string[], from: string) => {
    if (from !== 'reset') {
      analytics.trackGuestListTableFilterApplyClicked(location, { column: 'attending', filterValues: items });
    }

    document.dispatchEvent(
      new CustomEvent('irl-details-filterList', {
        detail: {
          key: 'events',
          selectedItems: items,
        },
      })
    );
    // setTopicFilterItems(items);
    eventsFilterProps?.onClosePane();
    eventsFilterProps?.setFilteredItems(events);
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
    topicFilterProps?.onClearSelection(e);
  };

  //clear event filter
  const onClearEventsFilter = (e: any) => {
    document.dispatchEvent(
      new CustomEvent('irl-details-filterList', {
        detail: {
          key: 'events',
          selectedItems: [],
        },
      })
    );
    topicFilterProps?.onClearSelection(e);
  };

  const onTopicsFilterclicked = () => {
    analytics.trackGuestListTableFilterClicked(location, 'topics');
    topicFilterProps?.onOpenPane();
    eventsFilterProps?.onClosePane();
  };

  const onEventsFilterclicked = () => {
    analytics.trackGuestListTableFilterClicked(location, 'attending');
    eventsFilterProps?.onOpenPane();
    topicFilterProps?.onClosePane();
  };

  return (
    <>
      {isUserLoggedIn && (
        <div className="tbl__hdr">
          <div className="tbl__hdr__teams">
            <div className="tbl__hdr__teams__txt" onClick={() => onSort('teamName')}>
              <img src={getSortIcon('teamName')} alt="sort" width={16} height={16} />
              Team
            </div>
          </div>
          <div className="tbl__hdr__guestName">
            <div onClick={() => onSort('memberName')} className="tbl__hdr__guestName__txt">
              <img src={getSortIcon('memberName')} alt="sort" width={16} height={16} />
              Attendee Name
            </div>
          </div>

          <div className="tbl__hdr__attending">
            Attending
            {events?.length > 0 && eventType === 'upcoming' && (
              <>
                <div className="tbl__hdr__attending__filter">
                  <button className="tbl__hdr__attending__filter__btn" onClick={onEventsFilterclicked}>
                    <img width={16} height={16} src="/icons/filter-blue.svg" alt="filter" />
                  </button>
                  {filterConfig?.events?.length > 0 && (
                    <div className="tbl__hdr__attending__filter__tag">
                      {filterConfig?.events?.length}
                      <button className="tbl__hdr__attending__filter__tag__btn" onClick={onClearEventsFilter}>
                        <img width={10} height={10} src="/icons/close-white.svg" alt="count" />
                      </button>
                    </div>
                  )}
                </div>
                {eventsFilterProps?.isPaneActive && (
                  <div className="tbl__hdr__attending__multiselect">
                    <FloatingMultiSelect {...eventsFilterProps} items={events} onFilter={onFilterByEvents} />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="tbl__hdr__topics">
            <div className="tbl__hdr__topics__ttl">Interested in</div>
            {topics?.length > 0 && (
              <>
                <div className="tbl__hdr__topics__filter">
                  <button className="tbl__hdr__topics__filter__btn" onClick={onTopicsFilterclicked}>
                    <img width={16} height={16} src="/icons/filter-blue.svg" alt="filter" />
                  </button>
                  {filterConfig?.topics?.length > 0 && (
                    <div className="tbl__hdr__topics__filter__tag">
                      {filterConfig?.topics?.length}
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
          <div className="tbl__hdr__lo__attendings">Attending</div>
          <div className="tbl__hdr__lo__topics">Interested in</div>
          <div className="tbl__hdr__lo__connect">Connect</div>
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
            min-height: 54px;
            border-radius: 8px 8px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background-color: white;
            padding: 0px 17px 0px 20px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            width: 900px;
          }

          .tbl__hdr__guestName {
            display: flex;
            width: 180px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__teams {
            display: flex;
            width: 150px;
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
            flex: 1;
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
            font-size: 13px;
            font-weight: 600;
            line-height: 24px;
            color: #0f172a;
          }

          .tbl__hdr__attending {
            width: 200px;
            display: flex;
            position: relative;
            align-items: center;
            padding-right: 16px;
            gap: 5px;
          }

          .tbl__hdr__topics {
            position: relative;
            display: flex;
            width: 205px;
            align-items: center;
            gap: 5px;
            padding-right: 10px;
          }

          .tbl__hdr__topics__ttl {
            font-size: 13px;
            font-weight: 600;
            line-height: 18px;
            text-align: left;
            color: #0f172a;
          }

          .tbl__hdr__topics__filter,
          .tbl__hdr__attending__filter {
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .tbl__hdr__topics__filter__tag,
          .tbl__hdr__attending__filter__tag {
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
          .tbl__hdr__topics__filter__tag__btn,
          .tbl__hdr__attending__filter__btn,
          .tbl__hdr__attending__filter__tag__btn {
            background: transparent;
            display: flex;
          }

          .tbl__hdr__topics__multiselect,
          .tbl__hdr__attending__multiselect {
            position: absolute;
            top: 44px;
            left: 0;
            width: 238px;
          }

          .tbl__hdr__lo {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            min-height: 42px;
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
            width: 160px;
            align-items: center;
            justify-content: flex-start;
            padding-left: 20px;
          }

          .tbl__hdr__lo__guestName {
            display: flex;
            width: 180px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__lo__dates {
            display: flex;
            width: 160px;
            align-items: center;
            justify-content: flex-start;
          }

          .tbl__hdr__lo__attendings {
            display: flex;
            width: 200px;
            align-items: center;
            justify-content: flex-start;
            padding-right: 20px;
          }

          .tbl__hdr__lo__topics {
            display: flex;
            width: 205px;
            align-items: center;
            justify-content: flex-start;
            padding-right: 20px;
          }

          .tbl__hdr__lo__connect {
            display: flex;
            width: 128px;
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
              // width: calc(100% - 2px);
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

export default AttendeeTableHeader;
