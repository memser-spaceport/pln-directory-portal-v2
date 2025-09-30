'use client';
import React, { useRef } from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import Modal from '@/components/core/modal';
import { ILocationDetails } from '@/types/irl.types';
import LinkTab from '@/components/page/irl/events/link-tab';
import Link from 'next/link';

const AddtionalResources = (props: any) => {
  const { eventDetails, searchParams, isLoggedIn } = props;
  const analytics = useIrlAnalytics();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addResRef = useRef<HTMLDialogElement>(null);
  const isEventAvailable =
    searchParams?.type === 'past' &&
    eventDetails?.pastEvents?.some((event: any) => event.slugURL === searchParams?.event);

  function handleAdditionalResourceClicked(resource: any) {
    analytics.trackAdditionalResourcesClicked(resource);
  }

  function getEventType(searchType: string, eventDetails: ILocationDetails) {
    if (searchType) {
      if (searchType === 'upcoming') {
        return 'upcoming';
      } else if (searchType === 'past') {
        return 'past';
      }
    } else if (eventDetails?.upcomingEvents?.length > 0) {
      return 'upcoming';
    } else if (eventDetails?.pastEvents?.length > 0) {
      return 'past';
    }
  }
  let eventType = getEventType(searchParams?.type, eventDetails);

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

  return (
    <>
      {eventDetails?.resources?.length > 0 && (searchParams?.type === 'past' && searchParams?.event ? isEventAvailable : true) && (
        <div className={`${searchParams?.type === 'past' ? 'irl__addResWrpr' : ''}`}>
          <div className="irl__addRes">
            <div className="irl__addRes__cnt">
              <div className="irl__addRes__cnt__icon">📋</div>
              <div>Resources</div>
            </div>

            <div className="irl__addRes__cntr">
              <div className="irl__addRes__cntr__resource">
                {eventDetails?.resources?.slice(0, 4).map((resource: any, index: number) => (
                  <div key={index} className="irl__addRes__cntr__resCnt">
                    <LinkTab resource={resource} handleAdditionalResourceClicked={handleAdditionalResourceClicked} />
                  </div>
                ))}
              </div>

              {eventDetails?.resources?.length > 4 && (
                <div className="irl__addRes__cntr__resCnt__showMore" onClick={handleAddResClick}>
                  <div>+{eventDetails?.resources?.length - 4}</div>
                  <div>more</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal modalRef={addResRef} onClose={onCloseModal}>
        <div className="irl__addRes__popup">
          <div className="irl__modalHeader">
            <div className="irl__modalHeader__title">Additional Resources</div>
            <div className="irl__modalHeader__count">({eventDetails?.resources?.length})</div>
          </div>
          <div className="irl__popupCntr">
            {eventDetails?.resources?.map((resource: any, index: number) => (
              <div key={index} className="irl__popupCnt">
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
      <style jsx>{`
        .irl__addRes,
        .irl__addRes__loggedOut {
          display: flex;
          flex-direction: row;
          border-radius: 4px;
          font-size: 14px;
          line-height: 20px;
          text-align: left;
          align-items: ${!isLoggedIn ? 'center' : 'unset'};
          justify-content: ${!isLoggedIn ? 'center' : 'unset'};
        }

        .irl__addRes {
          font-weight: 600;
        }
        .irl__addRes__loggedOut {
          font-weight: 400;
          height: 56px;
        }

        .irl__addRes {
          min-height: 36px;
          padding: 5px;
        }

        .irl__addRes__loggedOut {
          background-color: #ffe2c8;
          min-height: 44px;
          padding: 5px;
          border-radius: 0;
        }

        .irl__addRes__cnt__loggedOut {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 8px;
          align-items: center;
        }

        .irl__addRes__cnt__loggedOut a {
          background-color: #fff;
          width: 70px;
          height: 30px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-weight: 500;
        }

        .irl__addRes__cnt {
          display: flex;
          flex-direction: row;
          gap: 4px;
          padding: 6px;
          width: 100px;
        }

        .irl__addRes__cnt__icon {
          display: flex;
          justify-content: center;
        }

        .irl__addRes__popup {
          display: flex;
          overflow-y: auto;
          flex-direction: column;
          padding: 25px;
        }

        .irl__addResWrpr {
          scrollbar-width: none;
          scroll-behavior: smooth;
          overflow-x: scroll;
        }
        .irl__addRes__cntr {
          display: flex;
          flex-direction: row;
          gap: 6px;
          color: #156ff7;
          align-content: center;
          width: 77%;
        }

        .irl__addRes__cntr__resource {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 10px;
        }

        .irl__addRes__cntr__resCnt {
          display: flex;
          flex-direction: row;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .irl__addRes__cntr__resCnt__showMore {
          display: flex;
          flex-direction: unset;
          border: 1.5px solid rgba(226, 232, 240, 1);
          background-color: #fff;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          width: 68px;
          height: 23px;
          padding: 0px 7px 0px 5px;
          gap: 5px;
          border-radius: 6px;
          margin-top: ${isLoggedIn ? '6px' : 'usnset'};
          color: #156ff7;
          cursor: pointer;
        }
        .irl__modalHeader {
          display: flex;
          flex-direction: row;
          gap: 8px;
          position: absolute;
          width: 100%;
          gap: 8px;
        }

        .irl__modalHeader__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          text-align: left;
        }

        .irl__modalHeader__count {
          font-size: 14px;
          font-weight: 400;
          line-height: 32px;
          text-align: left;
          padding-top: 3px;
        }

        .irl__popupCntr {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          margin-top: ${isLoggedIn ? '44px' : '14px'};
        }
                  .irl__popupCnt {
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

        @media (min-width: 360px) {
          .irl__addRes__loggedOut {
            padding: 12px;
          }
          .irl__addRes__popup {
            width: 90vw;
            height: 394px;
          }
          .irl__addRes {
            // width:unset';
          }
          .irl__addRes__loggedOut {
            width: ${eventType === 'upcoming' || eventType === 'all' ? '' : 'unset'};
          }
                      .irl__popupCnt {
            width: 100%;
          }
        }
        @media (min-width: 450px) {
          .irl__addRes__loggedOut {
            height: 40px;
          }
        }
        @media (min-width: 768px) {
          .irl__addRes__loggedOut {
            max-width: 900px;
            width: 100%;
          }
        }
        @media (min-width: 1024px) {
          .irl__addRes,
          .irl__addRes__loggedOut {
            width: unset;
          }
          .irl__addRes__popup {
            width: 650px;
            height: 394px;
          }
        }
        @media (min-width: 1440px) {
          .irl__addRes__cntr {
            width: 84%;
          }
          .irl__addRes__loggedOut,
          .irl__submit__event {
            max-width: 1244px;
          }
        }
        @media (min-width: 1920px) {
          .irl__addRes__cntr {
            width: 88%;
          }
          .irl__addRes__loggedOut,
          .irl__submit__event {
            max-width: 1678px;
          }
          .irl__addRes__cntr {
            width: 91%;
          }

          .irl__addRes__loggedOut,
          .irl__submit__event {
            max-width: 2240px;
          }
        }
      `}</style>
    </>
  );
};
export default AddtionalResources;
