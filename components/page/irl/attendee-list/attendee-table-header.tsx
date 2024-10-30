import { useIrlAnalytics } from '@/analytics/irl.analytics';
import FloatingMultiSelect from './floating-multi-select';
import { useRouter, useSearchParams } from 'next/navigation';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import useFloatingSelect from '@/hooks/irl/use-floating-select';
import { getUniqueEvents } from '@/utils/irl.utils';
interface IAttendeeTableHeader {
  isLoggedIn: boolean;
  eventDetails: any;
}

const AttendeeTableHeader = (props: IAttendeeTableHeader) => {
  const isUserLoggedIn = props.isLoggedIn ?? false;
  const eventDetails = props?.eventDetails;

  const analytics = useIrlAnalytics();
  const events = getUniqueEvents(eventDetails?.eventsForFilter ?? []);
  const topics = eventDetails?.topics ?? [];
  const searchParams = useSearchParams();
  const eventType = searchParams.get('type');

  const router = useRouter();

  const attendingQueryParam = searchParams.get('attending');
  const attendingItems = attendingQueryParam ? attendingQueryParam.split(URL_QUERY_VALUE_SEPARATOR) : [];
  const matchedEvents = attendingItems?.filter((event: string) => events?.includes(event));

  const topicsQueryParam = searchParams.get('topics');
  const topicsItems = topicsQueryParam ? topicsQueryParam.split(URL_QUERY_VALUE_SEPARATOR) : [];

  const reverseRoleMapping: { [key: string]: string } = {
    hosts: 'Hosts only',
    speakers: 'Speakers only',
    hostsAndSpeakers: 'Hosts & speakers',
  } as any;
  const attendeeTypeParams = searchParams.get('attendees');
  const attendeeTypeItems = attendeeTypeParams ? attendeeTypeParams.split(URL_QUERY_VALUE_SEPARATOR) : [];
  const selectedAttendeeTypes = attendeeTypeItems.map((role) => reverseRoleMapping[role]).filter(Boolean);
  const attendeeTypeFilterItems = ['Hosts only', 'Speakers only', 'Hosts & speakers'];

  const eventsFilterProps = useFloatingSelect({
    items: events,
    selectedItems: matchedEvents,
    isMultiSelect: true,
  });

  const topicFilterProps = useFloatingSelect({
    items: topics,
    selectedItems: topicsItems,
    isMultiSelect: true,
  });

  const attendeeTypeFilterProps = useFloatingSelect({
    items: attendeeTypeFilterItems,
    selectedItems: selectedAttendeeTypes,
  });

  // sort columns
  const onSort = (sortBy: string) => {
    triggerLoader(true);
    // Get the current sorting direction from the query parameters
    const currentSortDirection = searchParams.get('sortDirection') || 'asc';
    const currentSortBy = searchParams.get('sortBy');

    // Determine the new sort direction
    let newSortDirection: string | null = null;

    // If the column changed, reset to 'asc'
    if (currentSortBy !== sortBy) {
      newSortDirection = 'asc';
    } else {
      if (currentSortDirection === 'asc') {
        newSortDirection = 'desc';
      } else if (currentSortDirection === 'desc') {
        newSortDirection = null;
      } else {
        newSortDirection = 'asc';
      }
    }

    // Update the query parameters
    const params = new URLSearchParams(searchParams);

    if (newSortDirection) {
      params.set('sortDirection', newSortDirection);
      params.set('sortBy', sortBy);
    } else {
      // Remove the parameters when going beyond 'desc'
      params.delete('sortDirection');
      params.delete('sortBy');
    }

    // Push the updated query parameters to the router
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    analytics.trackGuestListTableSortClicked(location, sortBy);
  };

  //get updated sort icon
  const getSortIcon = (column: string) => {
    const sortKey = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortDirection');

    if (sortKey === column) {
      if (sortOrder === 'asc') {
        return '/icons/sort-asc-blue.svg';
      } else if (sortOrder === 'desc') {
        return '/icons/sort-desc-blue.svg';
      }
    }
    return '/icons/sort-grey.svg';
  };

  //filter column by topics
  const onFilterByTopics = (items: string[], from: string) => {
    if (from !== 'reset') {
      analytics.trackGuestListTableFilterApplyClicked(location, { column: 'topics', filterValues: items });
    }

    const queryParams = new URLSearchParams(searchParams);
    const currentItems = queryParams.get('topics')?.split(URL_QUERY_VALUE_SEPARATOR) || [];
    const newItems = items.join(URL_QUERY_VALUE_SEPARATOR);

    if (currentItems.join(URL_QUERY_VALUE_SEPARATOR) === newItems) {
      eventsFilterProps?.onClosePane();
      eventsFilterProps?.setFilteredItems(events);
      return;
    }

    triggerLoader(true);
    if (items.length > 0) {
      queryParams.set('topics', newItems);
    } else {
      queryParams.delete('topics');
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    router.push(newUrl, { scroll: false });
    router.refresh();

    topicFilterProps?.onClosePane();
    topicFilterProps?.setFilteredItems(topics);
  };

  //filter column by events
  const onFilterByEvents = (items: string[], from: string) => {
    if (from !== 'reset') {
      analytics.trackGuestListTableFilterApplyClicked(location, { column: 'attending', filterValues: items });
    }

    const queryParams = new URLSearchParams(searchParams);
    const currentItems = queryParams.get('attending')?.split(URL_QUERY_VALUE_SEPARATOR) || [];
    const newItems = items.join(URL_QUERY_VALUE_SEPARATOR);

    if (currentItems.join(URL_QUERY_VALUE_SEPARATOR) === newItems) {
      eventsFilterProps?.onClosePane();
      eventsFilterProps?.setFilteredItems(events);
      return;
    }

    triggerLoader(true);
    if (items.length > 0) {
      queryParams.set('attending', newItems);
    } else {
      queryParams.delete('attending');
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    router.push(newUrl, { scroll: false });
    router.refresh();

    eventsFilterProps?.onClosePane();
    eventsFilterProps?.setFilteredItems(events);
  };

  const onFilterByAttendeeType = (items: string[], from: string) => {
    if (from !== 'reset') {
      analytics.trackGuestListTableFilterApplyClicked(location, { column: 'attendeeName', filterValues: items });
    }

    const roleMapping = {
      'Hosts only': 'hosts',
      'Speakers only': 'speakers',
      'Hosts & speakers': 'hostsAndSpeakers',
    } as any;

    const queryParams = new URLSearchParams(searchParams);

    const currentAttendees = queryParams.get('attendees');
    const newRoles = items
      .map((option) => roleMapping[option])
      .filter(Boolean)
      .join(URL_QUERY_VALUE_SEPARATOR);

    if (currentAttendees === newRoles) {
      attendeeTypeFilterProps?.onClosePane();
      attendeeTypeFilterProps?.setFilteredItems(attendeeTypeFilterItems);
      return;
    }

    triggerLoader(true);
    queryParams.delete('attendees');
    items.forEach((option) => {
      const role = roleMapping[option];
      if (role) {
        queryParams.set('attendees', role);
      }
    });

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    router.push(newUrl, { scroll: false });
    router.refresh();

    attendeeTypeFilterProps?.onClosePane();
    attendeeTypeFilterProps?.setFilteredItems(attendeeTypeFilterItems);
  };

  //clear topic filter
  const onClearTopicFilter = (e: any) => {
    triggerLoader(true);
    const currentParams = new URLSearchParams(searchParams);
    currentParams.delete('topics');
    router.push(`${window.location.pathname}?${currentParams.toString()}`, { scroll: false });
    router.refresh();
    topicFilterProps?.onClearSelection(e);
  };

  //clear event filter
  const onClearEventsFilter = (e: any) => {
    triggerLoader(true);
    const currentParams = new URLSearchParams(searchParams);
    currentParams.delete('attending');
    router.push(`${window.location.pathname}?${currentParams.toString()}`, { scroll: false });
    router.refresh();
    topicFilterProps?.onClearSelection(e);
  };

  const onClearAttendeesFilter = (e: any) => {
    triggerLoader(true);
    const currentParams = new URLSearchParams(searchParams);
    currentParams.delete('attendees');
    router.push(`${window.location.pathname}?${currentParams.toString()}`, { scroll: false });
    router.refresh();
    attendeeTypeFilterProps?.onClearSelection(e);
  };

  const onTopicsFilterclicked = () => {
    analytics.trackGuestListTableFilterClicked(location, 'topics');
    topicFilterProps?.onTogglePane();
    topicFilterProps?.setFilteredItems([...topics]);
    eventsFilterProps?.onClosePane();
    attendeeTypeFilterProps?.onClosePane();
  };

  const onEventsFilterclicked = () => {
    analytics.trackGuestListTableFilterClicked(location, 'attending');
    eventsFilterProps?.onTogglePane();
    eventsFilterProps?.setFilteredItems([...events]);
    topicFilterProps?.onClosePane();
    attendeeTypeFilterProps?.onClosePane();
  };

  const onAttendeeTypeFilterclicked = () => {
    analytics.trackGuestListTableFilterClicked(location, 'attendeeName');
    attendeeTypeFilterProps?.onTogglePane();
    attendeeTypeFilterProps?.setFilteredItems([...attendeeTypeFilterItems]);
    topicFilterProps?.onClosePane();
    eventsFilterProps?.onClosePane();
  };

  return (
    <>
      <div className="tbl__hdr">
        <div className="tbl__hdr__guestName">
          <div onClick={() => onSort('member')} className="tbl__hdr__guestName__txt">
            <img src={getSortIcon('member')} alt="sort" width={16} height={16} />
            Attendee Name
          </div>
          <div>
            <div className="tbl__hdr__attending__filter">
              <button className="tbl__hdr__attending__filter__btn" onClick={onAttendeeTypeFilterclicked}>
                <img width={16} height={16} src="/icons/filter-blue.svg" alt="filter" />
              </button>
              {selectedAttendeeTypes?.length > 0 && (
                <div className="tbl__hdr__attending__filter__tag">
                  {selectedAttendeeTypes?.length}
                  <button className="tbl__hdr__attending__filter__tag__btn" onClick={onClearAttendeesFilter}>
                    <img width={10} height={10} src="/icons/close-white.svg" alt="count" />
                  </button>
                </div>
              )}
            </div>
            {attendeeTypeFilterProps?.isPaneActive && (
              <div className="tbl__hdr__attending__multiselect">
                <FloatingMultiSelect {...attendeeTypeFilterProps} items={attendeeTypeFilterItems} onFilter={onFilterByAttendeeType} />
              </div>
            )}
          </div>
        </div>

        <div className="tbl__hdr__teams">
          <div className="tbl__hdr__teams__txt" onClick={() => onSort('team')}>
            <img src={getSortIcon('team')} alt="sort" width={16} height={16} />
            Team
          </div>
        </div>

        <div className="tbl__hdr__connect">Connect</div>

        <div className="tbl__hdr__attending">
          Attending
          {events?.length > 0 && eventType !== 'past' && (
            <>
              <div className="tbl__hdr__attending__filter">
                <button className="tbl__hdr__attending__filter__btn" onClick={onEventsFilterclicked}>
                  <img width={16} height={16} src="/icons/filter-blue.svg" alt="filter" />
                </button>
                {matchedEvents?.length > 0 && (
                  <div className="tbl__hdr__attending__filter__tag">
                    {matchedEvents?.length}
                    <button className="tbl__hdr__attending__filter__tag__btn" onClick={onClearEventsFilter}>
                      <img width={10} height={10} src="/icons/close-white.svg" alt="count" />
                    </button>
                  </div>
                )}
              </div>
              {eventsFilterProps?.isPaneActive && (
                <div className="tbl__hdr__attending__multiselect">
                  <FloatingMultiSelect {...eventsFilterProps} items={events} onFilter={onFilterByEvents} search />
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
                {topicsItems?.length > 0 && (
                  <div className="tbl__hdr__topics__filter__tag">
                    {topicsItems?.length}
                    <button className="tbl__hdr__topics__filter__tag__btn" onClick={onClearTopicFilter}>
                      <img width={10} height={10} src="/icons/close-white.svg" alt="count" />
                    </button>
                  </div>
                )}
              </div>
              {topicFilterProps?.isPaneActive && (
                <div className="tbl__hdr__topics__multiselect">
                  <FloatingMultiSelect {...topicFilterProps} items={topics} onFilter={onFilterByTopics} search />
                </div>
              )}
            </>
          )}
        </div>

        {eventDetails?.isExclusionEvent && <div className="tbl__hdr__dates">{`Date(s) Attending`}</div>}
      </div>
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
            width: 209px;
            align-items: center;
            justify-content: flex-start;
            gap: 5px;
          }

          .tbl__hdr__teams {
            display: flex;
            width: 206px;
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
            // flex: 1;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
            width: 136px;
            padding-right: 10px;
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
            width: 152px;
            display: flex;
            position: relative;
            align-items: center;
            padding-right: 16px;
            gap: 5px;
          }

          .tbl__hdr__topics {
            position: relative;
            display: flex;
            width: 173px;
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

          .tbl__hdr__attending__filter__btn,
          .tbl__hdr__topics__filter__btn {
            border-radius: 50%;
            border: 1px solid #156ff7;
            height: 22px;
            width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
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

          @media (min-width: 1440px) {
            .tbl__hdr {
              width: 1244px;
            }

            .tbl__hdr__guestName {
              width: 224px;
            }

            .tbl__hdr__teams {
              width: 188px;
            }

            .tbl__hdr__connect {
              width: 188px;
            }

            .tbl__hdr__attending {
              width: 216px;
            }
          }

          @media (min-width: 1920px) {
            .tbl__hdr {
              width: 1678px;
            }

            .tbl__hdr__guestName {
              width: 331px;
            }

            .tbl__hdr__teams {
              width: 278px;
            }

            .tbl__hdr__connect {
              width: 335px;
            }

            .tbl__hdr__attending {
              width: 370px;
            }
          }

          @media (min-width: 2560px) {
            .tbl__hdr {
              width: 2240px;
            }

            .tbl__hdr__guestName,
            .tbl__hdr__teams,
            .tbl__hdr__connect {
              width: 439.67px;
            }

            .tbl__hdr__attending {
              width: 370px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AttendeeTableHeader;
