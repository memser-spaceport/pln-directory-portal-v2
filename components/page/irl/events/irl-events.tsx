'use client';

import Modal from '@/components/core/modal';
import { useRef } from 'react';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { getFormattedDateString } from '@/utils/irl.utils';
import IrlUpcomingEvents from './irl-upcoming-events';
import IrlPastEvents from './irl-past-events';
import { triggerLoader } from '@/utils/common.utils';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useRouter } from 'next/navigation';
import { ILocationDetails } from '@/types/irl.types';
import Image from 'next/image';
import { IRL_SUBMIT_FORM_LINK } from '@/utils/constants';

interface IIrlEvents {
  searchParams: any;
  eventDetails: ILocationDetails;
  isLoggedIn: boolean;
}

const IrlEvents = (props: IIrlEvents) => {
  const searchParams = props?.searchParams;
  const eventDetails = props?.eventDetails;
  const isLoggedIn = props?.isLoggedIn;
  let isUpcoming = true;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addResRef = useRef<HTMLDialogElement>(null);
  const { updateQueryParams } = useUpdateQueryParams();
  const analytics = useIrlAnalytics();
  const router = useRouter();

  const searchType = searchParams?.type;
  if (searchType === 'upcoming' && !isUpcoming) {
    isUpcoming = true;
  } else if (searchType === 'past' && isUpcoming) {
    isUpcoming = false;
  }

  const handleUpcomingGathering = () => {
    isUpcoming = true;
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('type', 'upcoming');
    currentParams.delete('event');
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
    // updateQueryParams('type', 'upcoming', searchParams);
    if (searchParams?.type === 'past') {
      triggerLoader(true);
      analytics.trackUpcomingEventsButtonClicked(eventDetails.upcomingEvents);
    }
  };

  const handlePastGathering = () => {
    isUpcoming = false;

    const currentParams = new URLSearchParams(searchParams);

    // Add or update the new search parameters
    currentParams.set('type', 'past');
    if (eventDetails?.pastEvents?.length > 0) {
      currentParams.set('event', eventDetails?.pastEvents[0]?.slugURL);
    }

    router.push(`${window.location.pathname}?${currentParams.toString()}`);
    if (searchParams?.type !== 'past') {
      triggerLoader(true);
    }
    analytics.trackPastEventsButtonClicked(eventDetails.pastEvents);
  };

  const onCloseModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }

    if (addResRef.current) {
      addResRef.current.close();
    }
  };

  const handleAddResClick = () => {
    if (addResRef.current) {
      addResRef.current.showModal();
    }
    analytics.trackAdditionalResourceSeeMoreButtonClicked(eventDetails.resources);
  };

  function getFormattedDate(events: any) {
    const startDateList = events?.map((gathering: any) => gathering.startDate);
    const endDateList = events?.map((gathering: any) => gathering.endDate);

    let leastStartDate = startDateList[0];
    let highestEndDate = endDateList[0];

    startDateList?.map((startDate: string) => {
      const date = new Date(startDate);
      if (date < new Date(leastStartDate)) {
        leastStartDate = startDate;
      }
    });

    endDateList?.map((endDate: string) => {
      const date = new Date(endDate);
      if (date > new Date(highestEndDate)) {
        highestEndDate = endDate;
      }
    });

    const result = getFormattedDateString(leastStartDate, highestEndDate);
    return `${result}`;
  }

  function handleJoinPLNetworks() {
    analytics.onJoinPLNetworkClicked(eventDetails);
  }

  function handleAddGathering() {
    analytics.onAddGatheringClicked(IRL_SUBMIT_FORM_LINK);
  }

  function handleAdditionalResourceClicked(resource: any) {
    analytics.trackAdditionalResourcesClicked(resource);
  }

  return (
    <>
      <div className="root">
        <div className="root__irl">
          <div className={`root__irl__events`}>
            <button className={`root__irl__events__upcoming ${isUpcoming ? 'root__irl__events__active' : 'root__irl__events__inactive'}`} onClick={handleUpcomingGathering}>
              Upcoming
              <span className={`root__irl__events__count ${isUpcoming ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}>{eventDetails?.upcomingEvents?.length}</span>
            </button>
            <button className={`root__irl__events__past ${!isUpcoming ? 'root__irl__events__active' : 'root__irl__events__inactive'}`} onClick={handlePastGathering}>
              Past
              <span className={`root__irl__events__count ${!isUpcoming ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}>{eventDetails?.pastEvents?.length}</span>
            </button>
          </div>

          {isUpcoming && eventDetails?.upcomingEvents?.length > 0 && (
            <div className="root__irl__eventWrapper">
              <div className="root__irl__eventWrapper__icon">
                <img src="/images/irl/calendar.svg" alt="calendar" />
              </div>
              <div>
                <span className="root__irl__eventWrapper__mobileTile">Events from</span>
                <span className="root__irl__eventWrapper__desktopTile">Upcoming events from</span>
                {getFormattedDate(eventDetails?.upcomingEvents)}
              </div>
            </div>
          )}
        </div>
        <div className="mob">
          {isUpcoming && <IrlUpcomingEvents eventDetails={eventDetails} isLoggedIn={isLoggedIn} isUpcoming={isUpcoming} searchParams={searchParams} />}

          {!isUpcoming && <IrlPastEvents eventDetails={eventDetails} isLoggedIn={isLoggedIn} isUpcoming={isUpcoming} searchParams={searchParams} />}

          {eventDetails?.resources?.length > 0 && (
            <div className="root__irl__addRes">
              <div className="root__irl__addRes__cnt">
                <div className="root__irl__addRes__cnt__icon">📋</div>
                <div>Additional Resources</div>
              </div>

              <div className="root__irl__addRes__cntr">
                <div className="root__irl__addRes__cntr__resource">
                  {eventDetails?.resources?.slice(0, 3).map((resource: any, index: number) => (
                    <div key={index} className="root__irl__addRes__cntr__resCnt">
                      <div style={{ display: 'flex' }} onClick={() => handleAdditionalResourceClicked(resource)}>
                        <img src="/icons/hyper-link.svg" alt="icon" />
                      </div>
                      <a href={resource?.link} target="_blank">
                        {resource?.type}
                      </a>
                      <div>
                        <img src="/icons/arrow-blue.svg" alt="arrow icon" />
                      </div>
                    </div>
                  ))}
                </div>

                {eventDetails?.resources?.length > 3 && (
                  <div className="root__irl__addRes__cntr__resCnt__showMore" onClick={handleAddResClick}>
                    <div>+{eventDetails?.resources?.length - 3}</div>
                    <div>more</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="root__irl__addRes__loggedOut">
              <div className="root__irl__addRes__cnt__loggedOut">
                <div>
                  <img src="/icons/info-orange.svg" alt="info" />
                </div>
                <div>Attending an event but aren&apos;t part of the network yet?</div>
                <button onClick={handleJoinPLNetworks}>
                  <a href="https://airtable.com/appHT5ErKdHcsFznj/shryt1Y1xDKZTemJS" target="_blank">
                    Join
                  </a>
                </button>
              </div>
            </div>
          )}

          <Modal modalRef={addResRef} onClose={onCloseModal}>
            <div className="root__irl__addRes__popup">
              <div className="root__irl__modalHeader">
                <div className="root__irl__modalHeader__title">Additional Resources</div>
                <div className="root__irl__modalHeader__count">({eventDetails?.resources?.length})</div>
              </div>
              <div className="root__irl__popupCntr">
                {eventDetails?.resources?.map((resource: any, index: number) => (
                  <div key={index} className="root__irl__popupCnt">
                    <div>
                      <img src="/icons/hyper-link.svg" alt="icon" />
                    </div>
                    <a href={resource?.link} target="_blank">
                      {resource?.name}
                    </a>
                    <div>
                      <img src="/icons/arrow-blue.svg" alt="arrow icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        </div>
      </div>
      <div className="add-gathering">
        <div className="add-gathering__icon">
          <Image src="/icons/irl/add-gathering.svg" alt="add-gathering" width={19} height={19} />
        </div>
        <div className="add-gathering__content">
          <div className="add-gathering__txt">Don&apos;t see the event you are interested in?</div>
          <div className="add-gathering__click">
            <a href={IRL_SUBMIT_FORM_LINK} target="_blank" onClick={handleAddGathering}>
              Submit an Event
            </a>
          </div>
        </div>
      </div>
      <style jsx>{`
        .root {
          color: #0f172a;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .add-gathering {
          max-width: 900px;
          background-color: #f8fafc;
          box-shadow: 0px 4px 4px 0px #0f172a0a;
          //   border: 1px solid #f8fafc;
          border-top: 0;
          border-radius: 0;
          padding: 13px;
          padding-left: 20px;
          display: flex;
          align-items: center;
        }

        .add-gathering__icon{
            display: flex;
        }

        .add-gathering__txt {
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          //   padding-left: 10px;
          //   padding-right: 4px;
        }

        .add-gathering__content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-left: 10px;
        }

        .add-gathering__click {
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          color: #156ff7;
        }
        .root__irl {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .root__irl__events {
          width: 310px;
          height: 48px;
          padding: 3px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          display: flex;
          flex-direction: row;
        }

        .root__irl__events button {
          height: 40px;
          padding: 6px 12px 6px 12px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          border-radius: 8px;
          border: none;
          width: 155px;
        }

        .root__irl__events__active {
          background-color: #156ff7;
          color: #fff;
        }

        .root__irl__events__inactive {
          background-color: #fff;
          color: #0f172a;
        }

        .root__irl__events__upcoming {
          width: 122px;
          height: 40px;
          padding: 10px 16px 10px 16px;
          gap: 4px;
          border-radius: 8px;
          border: 1px;
        }

        .root__irl__events__past {
          width: 101px;
          height: 40px;
          padding: 10px 16px 10px 16px;
          gap: 4px;
          border-radius: 8px;
          border: 1px;
        }

        .root__irl__events__count {
          margin-left: 5px;
          font-size: 11px;
          font-weight: 500;
          line-height: 14px;
          text-align: left;
        }

        .root__irl__events__active__count {
          width: 17px;
          height: 14px;
          padding: 1px 5px 0px 5px;
          gap: 10px;
          border-radius: 2px;
          border: 0.5px solid #fff;
        }

        .root__irl__events__inactive__count {
          padding: 1px 4px 0px 4px;
          border-radius: 2px;
          border: 0.5px solid transparent;
          background-color: #f1f5f9;
          color: #475569;
        }

        .root__irl__eventWrapper {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 6px 12px 6px 12px;
          gap: 4px;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
          height: 32px;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__eventWrapper__icon {
          display: flex;
          justify-content: center;
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

        .root__irl__table-col__headerName {
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

        .root__irl__table__header {
          background-color: #f8fafc;
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
          background-color: #f8fafc;
          min-height: 36px;
          padding: 5px;
        }

        .root__irl__addRes__loggedOut {
          background-color: #ffe2c8;
          min-height: 44px;
          padding: 5px;
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

        .root__irl__resPopup,
        .root__irl__addRes__popup {
          display: flex;
          overflow-y: auto;
          flex-direction: column;
          padding: 25px;
        }

        .root__irl__modalHeader {
          display: flex;
          flex-direction: row;
          gap: 8px;
          position: absolute;
          width: 100%;
          gap: 8px;
        }

        .root__irl__modalHeader__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          text-align: left;
        }

        .root__irl__modalHeader__count {
          font-size: 14px;
          font-weight: 400;
          line-height: 32px;
          text-align: left;
          padding-top: 3px;
        }

        .root__irl__popupCntr {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          margin-top: ${isLoggedIn ? '44px' : '14px'};
        }

        .root__irl__popup__header {
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          background-color: #ffe2c8;
          margin-top: 50px;
          display: flex;
          flex-direction: row;
          height: 34px;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
        }

        .root__irl__popup__header__loginBtn {
          color: #156ff7;
        }

        .root__irl__popupCnt {
          display: flex;
          flex-direction: row;
          gap: 8px;
          width: 594px;
          height: 48px;
          padding: 14px 0px 14px 0px;
          gap: 10px;
          border-bottom: 1px solid #cbd5e1;
          color: #156ff7;
        }

        .root__irl__addRes__cntr {
          display: flex;
          flex-direction: row;
          gap: 6px;
          color: #156ff7;
          align-content: center;
          width: 77%;
        }

        .root__irl__addRes__cntr__resource {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 10px;
        }

        .root__irl__addRes__cntr__resCnt {
          display: flex;
          flex-direction: row;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .root__irl__addRes__cntr__resCnt__showMore {
          display: flex;
          flex-direction: unset;
          border: 1px solid #cbd5e1;
          background-color: #fff;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          width: 68px;
          height: 23px;
          padding: 0px 7px 0px 5px;
          gap: 7px;
          border-radius: 29px;
          margin-top: ${isLoggedIn ? '6px' : 'usnset'};
          color: #156ff7;
          cursor: pointer;
        }

        @media (min-width: 360px) {
          .root {
            scroll-behavior: smooth;
            scrollbar-width: none;
            border-radius: unset;
            min-height: 162px;
            background-color: #fff;
            // border: 1px solid #0f172a0a;
            // box-shadow: 0px 4px 4px 0px #0F172A0A;
            box-shadow: 0px -4px 4px 0px #0f172a0a;
            max-width: 900px;
            padding: 20px 0px 20px 20px;
            border-bottom: 0;
          }
          .add-gathering {
            box-shadow: 0px 4px 4px 0px #0f172a0a;
          }
          .mob {
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-x: ${searchParams?.type === 'past' ? 'visible' : 'auto'};
            scroll-behavior: smooth;
            scrollbar-width: none;
            margin-right: ${!isUpcoming ? '20px' : ''};
          }

          .root__irl__resPopup,
          .root__irl__addRes__popup {
            width: 90vw;
            height: 394px;
          }

          .root__irl__popupCnt {
            width: 100%;
          }

          .root__irl__addRes {
            width: ${isUpcoming ? '858px' : 'unset'};
          }

          .root__irl {
            flex-direction: column;
            align-items: baseline;
            gap: 16px;
          }

          .root__irl__addRes__loggedOut {
            width: ${isUpcoming ? '858px' : 'unset'};
          }

          .root__irl__eventWrapper__mobileTile {
            display: inline;
            padding-right: 5px;
          }
          .root__irl__eventWrapper__desktopTile {
            display: none;
          }

          .root__irl__eventWrapper {
            min-width: 231px;
            margin-right: 20px;
          }
        }

        @media (min-width: 450px) {
          
            .add-gathering__content{
                flex-direction: row;
                gap: 4px;
              }
        }
        

        @media (min-width: 700px) {
          .root__irl {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (min-width: 1024px) {
          .root {
            overflow-x: unset;
            border-top-right-radius: 8px;
            border-top-left-radius: 8px;
            padding: 20px;
          }

          .add-gathering {
            border-bottom-right-radius: 8px;
            border-bottom-left-radius: 8px;
          }
          .mob {
            overflow-x: unset;
            width: 864px;
          }

          .root__irl__addRes,
          .root__irl__addRes__loggedOut {
            width: unset;
          }

          .root__irl {
            width: unset;
            justify-content: space-between;
          }

          .root__irl__resPopup,
          .root__irl__addRes__popup {
            width: 650px;
            height: 394px;
          }

          .root__irl__eventWrapper__desktopTile {
            display: inline;
            padding-right: 5px;
          }

          .root__irl__eventWrapper__mobileTile {
            display: none;
          }

          .root__irl__eventWrapper {
            min-width: 310px;
            margin-right: unset;
          }
        }
      `}</style>
    </>
  );
};

export default IrlEvents;
