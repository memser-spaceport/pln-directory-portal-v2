'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { getFormattedDateString } from '@/utils/irl.utils';
import { useEffect, useRef, useState } from 'react';
import IrlEventsPopupOverlay from './irl-events-popup-overlay';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import useClickedOutside from '@/hooks/useClickedOutside';
import IrlEventsTableView from './irl-events-table-view';
import clip from 'text-clipper';
import { sanitize } from 'isomorphic-dompurify';
import SearchGatherings from './search-gatherings';

interface EventDetailsProps {
  eventDetails: {
    upcomingEvents: Array<any>;
    pastEvents: Array<any>;
  };
  isLoggedIn: boolean;
  isUpcoming: boolean;
  searchParams: any;
  handleDataNotFound: () => void;
}

const IrlPastEvents = ({ eventDetails, isLoggedIn, isUpcoming, searchParams, handleDataNotFound }: EventDetailsProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { updateQueryParams } = useUpdateQueryParams();
  const analytics = useIrlAnalytics();
  const [resources, setResources] = useState([]);

  const limit = 80; // character limit for the description
  const eventType = isUpcoming ? 'Upcoming Events' : 'Past Events';

  const events = isUpcoming ? eventDetails?.upcomingEvents : eventDetails?.pastEvents;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const router = useRouter();

  const [searchText, setSearchText] = useState('');

  const eventsToShow = events;

  // Determine the selected event based on searchParams
  let selectedEvent = eventsToShow[0];
  if (searchParams?.event) {
    const foundIndex = eventsToShow.findIndex((event) => event.slugURL === searchParams.event);
    if (foundIndex !== -1) {
      selectedEvent = eventsToShow[foundIndex];
    }
  }

  const handleElementClick = (gathering: any) => {
    if (gathering.slugURL !== searchParams?.event) {
      triggerLoader(true);
      const currentParams = new URLSearchParams(searchParams);
      const allowedParams = ['event', 'type', 'location'];

      // Remove parameters not in the allowed list
      for (const [key, value] of Object.entries(searchParams)) {
        if (!allowedParams.includes(key)) {
          currentParams.delete(key);
        }
      }
      currentParams.set('event', gathering.slugURL);
      router.push(`${window.location.pathname}?${currentParams.toString()}`);
      analytics.trackPastEventClicked(gathering);
    }
  };

  const handleDropdownToggle = () => {
    if (selectedEvent) {
      setDropdownOpen((prevState) => !prevState);
    }
  };

  const toggleDescription = () => {
    setExpanded((prevState) => !prevState);
  };

  const handleEventSelection = (gathering: { slugURL: string }) => {
    if (gathering.slugURL !== searchParams?.event) {
      triggerLoader(true);
      selectedEvent = gathering;
      const currentParams = new URLSearchParams(searchParams);
      const allowedParams = ['event', 'type', 'location'];

      // Remove parameters not in the allowed list
      for (const [key, value] of Object.entries(searchParams)) {
        if (!allowedParams.includes(key)) {
          currentParams.delete(key);
        }
      }
      currentParams.set('event', gathering.slugURL);
      router.push(`${window.location.pathname}?${currentParams.toString()}`);
    }
    setDropdownOpen(false);
    setSearchText('');
  };

  const onCloseModal = () => {
    if (dialogRef.current) {
      (dialogRef.current as any as HTMLDialogElement).close();
    }
  };

  const handleAdditionalResourceClick = (resources: any) => {
    analytics.trackAdditionalResourceClicked(resources);
  };

  function handleClick(resource: any, event: any) {
    event.stopPropagation();
    setResources(resource);
    analytics.trackPastResourcePopUpViewed(resource);
    if (dialogRef.current) {
      (dialogRef.current as any as HTMLDialogElement).showModal();
    }
  }

  function onLoginClickHandler() {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
    (dialogRef.current as any as HTMLDialogElement).close();
    analytics.trackLoginClicked(eventDetails);
  }

  const handleSearchTextClear = () => {
    setSearchText('');
  };

  const handleOnChange = (e: any) => {
    setSearchText(e.target.value);
  };

  useClickedOutside({
    ref: dropdownRef,
    callback: () => {
      setDropdownOpen(false);
      setSearchText('');
    },
  });

  const sanitizedDesc = sanitize(selectedEvent?.description);
  const clippedDesc = clip(sanitizedDesc, 80, { html: true, maxLines: 2 });

  const isEventAvailable = searchParams?.type ? searchParams?.type === 'past' && eventDetails?.pastEvents?.some((event) => event.slugURL === searchParams?.event) : true;

  useEffect(() => {
    const gathering = eventsToShow.find((event: any) => event.slugURL === searchParams?.event);
    const container = document.getElementById('container');
    const element = document.getElementById(`past-web-${gathering.uid}`);

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element ? element.getBoundingClientRect() : null;
      const scrollTop = elementRect ? elementRect.top - containerRect.top + container.scrollTop : 0;
      container.scrollTo({ top: scrollTop - 42, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <div className="root__irl__tableContainer" id="container">
        <div className="root__irl__table">
          {eventsToShow?.length > 0 && isEventAvailable ? (
            <>
              <div className="root__irl__table__header">
                <div className="root__irl__table-row__header">
                  <div className="root__irl__table-col__headerName">
                    <SearchGatherings searchParams={searchParams} type="past" eventsToShow={eventsToShow} setExpanded={setExpanded} setItemsToShow={null} />
                  </div>
                  <div className="root__irl__table-col__headerDesc">Description</div>
                  <div className="root__irl__table-col__headerRes">Resources</div>
                </div>
              </div>
              {eventsToShow?.map((gathering, index) => (
                <div key={gathering?.uid} id={`past-web-${gathering?.uid}`}>
                  <IrlEventsTableView
                    isLoggedIn={isLoggedIn}
                    resources={resources}
                    key={gathering.uid}
                    gathering={gathering}
                    handleClick={handleClick}
                    eventsToShow={eventsToShow}
                    isLastContent={index === eventsToShow.length - 1}
                    handleElementClick={() => handleElementClick(gathering)}
                    isEventSelected={searchParams?.event ? searchParams?.event === gathering.slugURL : eventsToShow[0]?.slugURL === gathering.slugURL}
                    eventType={!isUpcoming}
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="root__irl__table__no-data">
              <div>
                <img src="/icons/no-calender.svg" alt="calendar" />
              </div>
              <div>
                No results found for the applied input{' '}
                <span className="root__irl__table__no-data__errorMsg" onClick={handleDataNotFound}>
                  Reset to default im
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <IrlEventsPopupOverlay
        dialogRef={dialogRef}
        onCloseModal={onCloseModal}
        resources={resources}
        isLoggedIn={isLoggedIn}
        onLoginClickHandler={onLoginClickHandler}
        handleAdditionalResourceClick={() => handleAdditionalResourceClick(resources)}
      />

      {/* Mobile View Section */}
      <div className="root__irl__mobileView" ref={dropdownRef}>
        <div className="custom-dropdown">
          <div className="custom-dropdown__header" onClick={handleDropdownToggle}>
            <div style={{ display: 'flex' }}>
              {selectedEvent ? (
                <>
                  <div className="root__irl__mobileView__top__cnt">
                    <div>
                      <img src={selectedEvent?.logo?.url} style={{ height: '15px', width: '15px' }} alt="logo" />
                    </div>
                    <div className="root__irl__mobileView__top__cnt__title">{selectedEvent?.name}</div>
                  </div>
                  <div className="root__irl__mobileView__top__cnt__eventDate">{getFormattedDateString(selectedEvent?.startDate, selectedEvent?.endDate)}</div>
                </>
              ) : (
                <div className="root__irl__mobileView__top__cnt__eventDate">
                  <div style={{ display: 'flex', paddingRight: '4px' }}>
                    <img src="/icons/no-calender.svg" alt="calendar" />
                  </div>
                  <div>No {eventType} currently in this location</div>
                </div>
              )}
            </div>
            <div className="root__irl__table-col__inviteOnlyIcon">
              {selectedEvent?.type && (
                <Tooltip
                  asChild
                  side="top"
                  align="center"
                  trigger={
                    <div>
                      <img src="/icons/Invite_only.svg" alt="invite-only" />
                    </div>
                  }
                  content={<div>This is an invite only event</div>}
                />
              )}
              {selectedEvent && <img src="/icons/dropdown-blue.svg" alt="dropdown" />}
            </div>
          </div>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              <div className="custom-dropdown__menu">
                <div>
                  <div style={{ paddingBottom: '10px' }}>
                    <img className="root__irl__search__img" height={16} width={16} src="/icons/search-gray.svg" alt="search" />
                    <input type="text" placeholder="Search Gatherings" className="custom-dropdown__search" value={searchText} onChange={handleOnChange} />
                    <button onClick={handleSearchTextClear}>
                      <img className="root__irl__search__cls" height={16} width={16} src="/icons/close.svg" alt="close" />
                    </button>
                  </div>
                  {eventsToShow?.filter((gathering) => gathering.name.toLowerCase().includes(searchText.toLowerCase())).length === 0 ? (
                    <div className="custom-dropdown__item">No data found</div>
                  ) : (
                    <>
                      {eventsToShow
                        ?.filter((gathering) => gathering.name.toLowerCase().includes(searchText.toLowerCase()))
                        .map((gathering, index) => (
                          <div
                            key={index}
                            className={`custom-dropdown__item ${gathering.slugURL === searchParams?.event ? 'custom-dropdown__item--active' : ''}`}
                            onClick={() => handleEventSelection(gathering)}
                          >
                            <div style={{ display: 'flex' }}>
                              <div className="root__irl__mobileView__top__cnt">
                                <div>
                                  <img src={gathering?.logo?.url} style={{ height: '15px', width: '15px' }} alt="logo" />
                                </div>
                                <div className="root__irl__mobileView__top__cnt__title">{gathering.name}</div>
                              </div>
                              <div className="root__irl__mobileView__top__cnt__eventDate">{getFormattedDateString(gathering?.startDate, gathering?.endDate)}</div>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Selected event details logic */}
          {selectedEvent && (
            <div className="root__irl__mobileView__body">
              <div className="root__irl__mobileView__body__title">
                <div dangerouslySetInnerHTML={{ __html: isExpanded ? selectedEvent?.description : clippedDesc }}></div>
                {selectedEvent?.description?.length > limit && (
                  <span>
                    <span onClick={toggleDescription} style={{ color: '#156FF7', cursor: 'pointer' }}>
                      {isExpanded ? ' Show Less' : ' Show More'}
                    </span>
                  </span>
                )}
              </div>
              {selectedEvent?.resources.length > 0 && (
                <div className="root__irl__mobileView__body__cnt">
                  <div className="root__irl__mobileView__body__cnt__contentRes" onClick={(event) => handleClick(selectedEvent?.resources, event)}>
                    <div>
                      <img src="/images/irl/elements.svg" alt="view" />
                    </div>
                    <div style={{ paddingBottom: '4px' }}>View Resources</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .root__irl__table-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        .root__irl__table-col-header {
          display: flex;
          flex-direction: column;
        }

        .root__irl__tableContainer {
          position: relative;
          max-height: 256px;
          overflow: auto;
          scroll-behavior: smooth;
        }

        .root__irl__table {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 99.5%;
          background-color: #fff;
          // border-spacing: 5px;
        }

        .root__irl__table__no-data {
          border: 1px solid #cbd5e1;
          display: flex;
          flex-direction: row;
          gap: 8px;
          justify-content: center;
          height: 54px;
          align-items: center;
          font-size: 13px;
          font-weight: 400;
          line-height: 15px;
          width: 864px;
        }

        .root__irl__table-row__header {
          border: 1px solid #cbd5e1;
          border-top-right-radius: 4px;
          border-top-left-radius: 4px;
        }

        .root__irl__table-row__content:last-child {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .root__irl__table-row__header,
        .root__irl__table-row__content {
          display: flex;
          flex-direction: row;
          width: 100%;
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-row__content {
          border-top: none;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
        }

        .root__irl__table-row__content {
          cursor: pointer;
        }

        .root__irl__table-row__content--active {
          background-color: rgba(219, 234, 254, 0.5);
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__contentName {
          width: 193px;
          padding: 10px;
          border-right: 1px solid #cbd5e1;
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__headerDesc,
        .root__irl__table-col__headerRes {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-col__headerDesc,
        .root__irl__table-col__contentDesc {
          width: 566px;
          padding: 10px;
          border-right: 1px solid #cbd5e1;
        }

        .root__irl__table-col__headerRes,
        .root__irl__table-col__contentRes {
          width: 91px;
          padding: 10px;
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__headerDesc,
        .root__irl__table-col__headerRes,
        .root__irl__table-col__contentName,
        .root__irl__table-col__contentDesc,
        .root__irl__table-col__contentRes {
          padding: 10px;
        }

        .root__irl__table-col__headerName {
          padding: 6px 8px;
        }

        .root__irl__table-col__contentDesc {
          display: flex;
          align-items: center;
        }

        .root__irl__table-col__contentRes {
          display: flex;
          justify-content: center;
          flex-direction: row;
        }

        .root__irl__table__header {
          background-color: #f8fafc;
          position: sticky;
          top: 0;
        }

        .root__irl__addRes,
        .root__irl__addRes__loggedOut {
          display: flex;
          flex-direction: row;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          align-items: ${!isLoggedIn ? 'center' : 'unset'};
          justify-content: ${!isLoggedIn ? 'center' : 'unset'};
        }

        .root__irl__addRes {
          background-color: #fff;
          height: 36px;
        }

        .root__irl__addRes__loggedOut {
          background-color: #ffe2c8;
          height: 44px;
        }

        .root__irl__addRes__cnt__loggedOut {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 8px;
          align-items: center;
        }

        .root__irl__addRes__cnt__loggedOut button {
          background-color: #fff;
          padding: 4px;
          width: 45px;
          height: 30px;
          padding: 6px 10px 6px 10px;
          border-radius: 8px;
        }

        .root__irl__addRes__cnt {
          display: flex;
          flex-direction: row;
          gap: 2px;
          padding: 6px;
          width: 185px;
        }

        .root__irl__addRes__cnt__icon {
          display: flex;
          justify-content: center;
        }

        .root__irl__table-col__contentName {
          display: flex;
          flex-direction: column;
        }

        .root__irl__table-col__contentName__top {
          display: flex;
          flex-direction: row;
          gap: 4px;
        }

        .root__irl__table-col__contentName__top__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-col__contentName__bottom {
          font-size: 11px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__mobileView__body {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px;
        }

        .root__irl__mobileView__body__cnt {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .root__irl__mobileView__body__cnt__contentRes {
          display: flex;
          flex-direction: row;
          gap: 4px;
          align-items: center;
          font-size: 11px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          color: #156ff7;
          cursor: pointer;
        }

        .root__irl__mobileView__top {
          height: 44px;
          background-color: #fff;
          border-radius: 12px;
          display: flex;
          flex-direction: row;
          padding: 8px;
          width: 328px;
        }

        .root__irl__mobileView__top__cnt {
          display: flex;
          flex-direction: row;
          gap: 10px;
          padding-right: 10px;
          border-right: 1px solid #cbd5e1;
          height: 20px;
          align-items: center;
        }

        .root__irl__mobileView__top__cnt__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__mobileView__top__cnt__eventDate {
          font-size: 11px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          padding-left: 10px;
          height: 20px;
          display: flex;
          align-items: center;
        }

        .root__irl__mobileView__body__title {
          font-size: 11px;
          font-weight: 400;
          line-height: 15px;
          text-align: left;
        }

        .custom-dropdown {
          position: relative;
          width: 100%;
          cursor: pointer;
        }

        .custom-dropdown__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background-color: #fff;
          border: 1px solid #156ff7;
          border-radius: 6px;
          min-height: 50px;
        }

        .custom-dropdown__menu {
          position: absolute;
          top: 50px;
          left: 0;
          right: 0;
          background-color: white;
          z-index: 4;
          max-height: 222px;
          overflow-y: auto;
          padding: 10px 15px 5px 15px;
          border: 1px solid #e2e8f0;
          // border-radius: 6px;
          border-top-left-radius: 2px;
          border-top-right-radius: 2px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          border-top: none;
        }

        .custom-dropdown__item {
          padding: 10px 5px 10px 5px;
          display: flex;
          justify-content: space-between;
          cursor: pointer;
          overflow-y: auto;
        }

        .custom-dropdown__item:hover {
          background-color: #f5f5f5;
        }

        .custom-dropdown__item--active {
          background-color: #f1f5f9;
        }

        .custom-dropdown__search {
          width: 100%;
          padding: 10px 10px 10px 40px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }

        .root__irl__search {
          position: relative;
          margin-bottom: 16px;
          display: block;
          width: 100%;
        }

        .root__irl__search__img {
          position: absolute;
          margin-block: auto;
          left: 25px;
          top: 21px;
        }

        .root__irl__search__cls {
          position: absolute;
          margin-block: auto;
          right: 26px;
          top: 21px;
        }

        .root__irl__search__cntr {
          padding: 15px;
          background-color: #fff;
        }

        .root__irl__search__input {
          height: 40px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          padding: 8px 0px 8px 36px;
          font-size: 14px;
          line-height: 24px;
          outline: none;
        }

        .root__irl__table-col__inviteOnlyIcon {
          display: flex;
          flexdirection: row;
          gap: 10px;
          padding-left: 4px;
        }

        .root__irl__table-col__contentRes__viewCnt {
          display: flex;
          flex-direction: row;
          gap: 4px;
          align-items: center;
          font-size: 11px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          color: #156ff7;
          cursor: pointer;
          justify-content: center;
          align-self: center;
        }

        .root__irl__table-col__contentRes__noCnt {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }

        .root__irl__table__no-data__errorMsg {
          cursor: pointer;
          color: #156ff7;
        }

        @media screen and (min-width: 360px) {
          .root__irl__mobileView {
            background-color: #dbeafe;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: left;
            border-radius: 12px;
          }

          .root__irl__tableContainer {
            display: none;
          }
        }

        @media screen and (min-width: 1024px) {
          .root__irl__mobileView {
            display: none;
          }

          .root__irl__tableContainer {
            position: relative;
            max-height: 256px;
            overflow: auto;
            scroll-behavior: smooth;
            display: block;
          }
        }

        @media (min-width: 1440px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 299px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 727px;
          }

          .root__irl__table-col__headerRes,
          .root__irl__table-col__contentRes {
            width: 177px;
            text-align: center;
          }

          .root__irl__table__no-data {
            width: 1203px;
          }
        }

        @media (min-width: 1920px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 355px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 1095px;
          }

          .root__irl__table-col__headerRes,
          .root__irl__table-col__contentRes {
            width: 178px;
          }

          .root__irl__table__no-data {
            width: 1638px;
          }
        }

        @media (min-width: 2560px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 502px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 1411px;
          }

          .root__irl__table-col__headerRes,
          .root__irl__table-col__contentRes {
            width: 277px;
          }

          .root__irl__table__no-data {
            width: 2196px;
          }
        }
      `}</style>
    </>
  );
};

export default IrlPastEvents;
