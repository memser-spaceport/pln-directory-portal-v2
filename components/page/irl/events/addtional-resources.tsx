'use client';
import React, { useRef, useState } from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import Modal from '@/components/core/modal';
import { ILocationDetails } from '@/types/irl.types';
import LinkTab from '@/components/page/irl/events/link-tab';

const AddtionalResources = (props: any) => {
  const { eventDetails, searchParams, isLoggedIn } = props;
  const analytics = useIrlAnalytics();
  const addResRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(false);
    if (addResRef.current) {
      addResRef.current.close();
    }
  };

  const handleAddResClick = () => {
    setIsModalOpen(true);
    if (addResRef.current) {
      addResRef.current.showModal();
    }
    analytics.trackAdditionalResourceSeeMoreButtonClicked(eventDetails.resources);
  };

  return (
    <>
      {(searchParams?.type === 'past' && searchParams?.event ? isEventAvailable : true) && (
        <div className={`${searchParams?.type === 'past' ? 'irl__addResWrpr' : ''}`}>
          <div className="irl__addRes">
            <div className="irl__addRes__cntr">
              <div className="irl__addRes__cntr__resource">
                {eventDetails?.resources?.map((resource: any, index: number) => (
                  <div key={index} className="irl__addRes__cntr__resCnt">
                    <LinkTab resource={resource} handleAdditionalResourceClicked={handleAdditionalResourceClicked} />
                  </div>
                ))}
              </div>

              {eventDetails?.resources?.length > 2 && (
                <div className="irl__addRes__cntr__resCnt__showMore" onClick={handleAddResClick}>
                  <div className="irl__showMore__count">+{eventDetails?.resources?.length - 2}</div>
                  <div>more</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal modalRef={addResRef} onClose={onCloseModal}>
        {isModalOpen && (
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
        )}
      </Modal>
      <style jsx>{`
        /* Mobile styles (default) */
        .irl__addRes {
          display: flex;
          flex-direction: row;
          font-size: 14px;
          line-height: 20px;
          text-align: left;
          align-items: ${!isLoggedIn ? 'center' : 'unset'};
          padding: 20px 14px;
          border-block: 1px solid #cbd5e1;
          min-height: 36px;
        }

        .irl__addRes__popup {
          display: flex;
          overflow-y: auto;
          flex-direction: column;
          padding: 16px 8px 16px 16px;
          width: 90vw;
          height: 394px;
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
          width: 100%;
        }

        .irl__addRes__cntr__resource {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 8px;
        }

        .irl__addRes__cntr__resCnt {
          display: flex;
          flex-direction: row;
          gap: 8px;
          justify-content: center;
          align-items: center;
          height: 24px;
          max-width: 120px;
        }

        /* Hide tags beyond the 2nd on mobile (default) */
        .irl__addRes__cntr__resCnt:nth-child(n + 3) {
          display: none;
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
          height: 24px;
          padding: 0px 7px 0px 5px;
          gap: 5px;
          border-radius: 6px;
          color: #156ff7;
          cursor: pointer;
        }

        /* Hide show more button on mobile when there are 2 or fewer tags */
        .irl__addRes__cntr__resCnt__showMore {
          display: ${eventDetails?.resources?.length > 2 ? 'flex' : 'none'};
        }

        /* Mobile count calculation - show count for tags beyond 2 */
        .irl__showMore__count {
          font-size: 0; /* Hide the original text */
        }

        .irl__showMore__count::before {
          content: '+${eventDetails?.resources?.length - 2}';
          font-size: 13px;
        }

        .irl__modalHeader {
          display: flex;
          flex-direction: row;
          gap: 8px;
          position: absolute;
          width: 100%;
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
          overflow-y: auto;
          margin-top: 34px;
          padding-right: 10px;
        }

        .irl__popupCnt {
          display: flex;
          flex-direction: row;
          gap: 10px;
          width: 100%;
          height: 48px;
          padding: 14px 0px;
          border-bottom: 1px solid #cbd5e1;
          color: #156ff7;
        }

        .irl__popupCnt:last-child {
          border-bottom: none;
        }

        /* Desktop styles (1024px and above) */
        @media (min-width: 1024px) {
          .irl__addRes {
            width: unset;
            border-block: unset;
            padding: 16px 0px;
          }

          .irl__addRes__popup {
            width: 650px;
            height: 394px;
            padding: 24px 14px 24px 24px;
          }

          .irl__addRes__cntr {
            width: 100%;
          }

          .irl__popupCntr {
            padding-right: 10px;
          }

          .irl__popupCnt {
            width: 594px;
          }

          .irl__addRes__cntr__resCnt {
            max-width: 150px;
          }

          /* Show up to 4 tags on desktop, hide beyond the 4th */
          .irl__addRes__cntr__resCnt:nth-child(n + 3) {
            display: flex;
          }

          .irl__addRes__cntr__resCnt:nth-child(n + 5) {
            display: none;
          }

          /* Show more button logic for desktop - show when more than 4 tags */
          .irl__addRes__cntr__resCnt__showMore {
            display: ${eventDetails?.resources?.length > 4 ? 'flex' : 'none'};
          }

          /* Desktop count calculation - show count for tags beyond 4 */
          .irl__showMore__count::before {
            content: '+${eventDetails?.resources?.length - 4}';
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};
export default AddtionalResources;
