'use client';

import { useRef, useState } from 'react';
import IrlEventsPopupOverlay from './irl-events-popup-overlay';
import IrlEventsTableView from './irl-events-table-view';
import { useRouter } from 'next/navigation';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IPastEvents, IUpcomingEvents } from '@/types/irl.types';
import { getFormattedDateString } from '@/utils/irl.utils';
import SearchGatherings from './search-gatherings';

interface EventDetailsProps {
  eventDetails: {
    upcomingEvents: IUpcomingEvents[];
    pastEvents: IPastEvents[];
    events: any;
  };
  isLoggedIn: boolean;
  isUpcoming: boolean;
  searchParams: any;
  handleDataNotFound: () => void;
}

const IrlAllEvents = ({ eventDetails, isLoggedIn, isUpcoming, searchParams, handleDataNotFound }: EventDetailsProps) => {

  let eventsToShow = eventDetails.events || [];
  const [isExpanded, setExpanded] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(4);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState([]);
  const analytics = useIrlAnalytics();
  const router = useRouter();

  const toggleDescription = () => {
    setItemsToShow(isExpanded ? 4 : itemsToShow + 4);
    if (itemsToShow >= eventsToShow?.length - 4) {
      setExpanded(!isExpanded);
    } else {
      setExpanded(isExpanded);
    }
  };

  const onCloseModal = () => {
    if (dialogRef.current) {
      (dialogRef.current as any as HTMLDialogElement).close();
    }
  };

  const handleAdditionalResourceClick = (resources: any) => {
    analytics.trackAdditionalResourceClicked(resources);
  };

  function handleClick(resource: any) {
    setResources(resource);
    analytics.trackUpcomingResourcePopUpViewed(eventDetails.upcomingEvents);
    if (dialogRef.current) {
      (dialogRef.current as any as HTMLDialogElement).showModal();
    }
  }

  function onLoginClickHandler() {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
    (dialogRef.current as any as HTMLDialogElement).close();
    analytics.trackLoginClicked(eventDetails);
  }

  return (
    <>
      <div className="root__irl__tableContainer" id="container">
        <div className="root__irl__table">
          {eventsToShow?.length > 0 ? (
            <>
              <div className="root__irl__table__header">
                <div className="root__irl__table-row__header">
                  <div className="root__irl__table-col__headerName">
                    <SearchGatherings searchParams={searchParams} type={"all"} eventsToShow={eventsToShow} setExpanded={setExpanded} setItemsToShow={setItemsToShow} />
                  </div>
                  <div className="root__irl__table-col__headerDesc">Description</div>
                  <div className="root__irl__table-col__headerRes">Resources</div>
                </div>
              </div>
              <div className="">
                <div className="root__irl__desktop__view">
                  {eventsToShow?.map((gathering: any, index: number) => (
                    <div key={gathering?.uid} id={`all-web-${gathering?.uid}`}>
                      <IrlEventsTableView
                        isLoggedIn={isLoggedIn}
                        key={gathering.uid}
                        gathering={gathering}
                        handleClick={handleClick}
                        eventsToShow={eventsToShow}
                        isLastContent={index === eventsToShow.length - 1}
                      />
                    </div>
                  ))}
                </div>
                <div className="root__irl__mobile__view">
                  {eventsToShow?.slice(0, itemsToShow)?.map((gathering: any, index: number) => (
                    <div key={`mob-${gathering?.uid}`} id={`all-mob-${gathering?.uid}`}>
                      <IrlEventsTableView
                        isLoggedIn={isLoggedIn}
                        key={gathering?.uid}
                        gathering={gathering}
                        handleClick={handleClick}
                        eventsToShow={eventsToShow}
                        isLastContent={eventsToShow.length <= 4 && index === eventsToShow.length - 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {eventsToShow?.length > 4 && (
                <div className="root__irl__mobileView__showMore__cntr" onClick={toggleDescription}>
                  {isExpanded ? ' Show Less' : ' Show More'}
                  <div className="root__irl__mobileView__icon">
                    {!isExpanded ? <img src="/icons/arrow-blue-down.svg" alt="down-arrow" /> : <img src="/icons/up-arrow-chevron.svg" alt="up-arrow" className="root__irl__mobileView__icon__up" />}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="root__irl__table__no-data">
              <div>
                <img src="/icons/no-calender.svg" alt="calendar" />
              </div>
              <div>No results found for the applied input
                  {' '}<span
                      className="root__irl__table__no-data__errorMsg"
                      onClick={handleDataNotFound}>
                      Reset to default
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
          // width: 864px;
        }

        .root__irl__table-row__header {
          border: 1px solid #cbd5e1;
          border-top-right-radius: 4px;
          border-top-left-radius: 4px;
        }

        .root__irl__table-row__header {
          display: flex;
          flex-direction: row;
          width: 100%;
          min-height: 40px;
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-col__headerName {
          width: 193px;
          padding: 8px 11px;
          background-color: inherit;
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

        .root__irl__table-col__headerDesc {
          width: 566px;
          padding: 10px;
          border-right: 1px solid #cbd5e1;
        }

        .root__irl__table-col__headerRes {
          width: 91px;
          padding: 10px;
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__headerDesc,
        .root__irl__table-col__headerRes {
          padding: 10px;
        }

        .root__irl__table-col__headerName {
          padding: 6px 8px;
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

        .root__irl__mobileView__icon {
          display: flex;
          height: 20px;
          width: 20px;
        }

        .root__irl__mobileView__icon__up {
          color: #156ff7;
          height: 20px;
          weight: 20px;
        }

        .root__irl__mobileView__showMore__cntr {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .root__irl__table__no-data__errorMsg {
            cursor: pointer;
            color: #156FF7;
        }

        @media screen and (min-width: 360px) {
          .root__irl__mobileView__showMore__cntr {
            width: 100%;
            height: 35px;
            border-bottom: 1px solid #cbd5e1;
            border-left: 1px solid #cbd5e1;
            border-right: 1px solid #cbd5e1;
            background: #dbeafe66;
            display: flex;
            flex-direction: row;
            padding-left: 8px;
            color: #156ff7;
            font-size: 13px;
            font-weight: 500;
            line-height: 20px;
            text-align: left;
            align-items: center;
          }

          .root__irl__tableContainer {
            position: relative;
            overflow: auto;
            scroll-behavior: smooth;
            scrollbar-width: thin;
            width: 862px;
          }

          .root__irl__mobile__view {
            display: flex;
            flex-direction: column;
          }

          .root__irl__desktop__view {
            display: none;
          }
        }

        @media screen and (min-width: 1024px) {
          .root__irl__mobileView__showMore__cntr {
            display: none;
          }

          .root__irl__tableContainer {
            width: unset;
            max-height: 256px;
          }

          .root__irl__mobile__view {
            display: none;
          }

          .root__irl__desktop__view {
            display: flex;
            flex-direction: column;
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

export default IrlAllEvents;
