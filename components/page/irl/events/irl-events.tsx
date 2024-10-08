"use client";

import Modal from "@/components/core/modal";
import { useRef } from "react";
import useUpdateQueryParams from "@/hooks/useUpdateQueryParams";
import { getFormattedDateString } from "@/utils/irl.utils";
import IrlUpcomingEvents from "./irl-upcoming-events";
import IrlPastEvents from "./irl-past-events";
import { triggerLoader } from "@/utils/common.utils";
import { useIrlAnalytics } from "@/analytics/irl.analytics";

interface IIrlEvents {
    isLoggedIn: boolean;
}

const IrlEvents = (props: any) => {
    const searchParams = props?.searchParams;
    const eventDetails = props?.eventDetails;
    const isLoggedIn = props.isLoggedIn;
    let isUpcoming = true;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const addResRef = useRef<HTMLDialogElement>(null);
    const { updateQueryParams } = useUpdateQueryParams();
    const analytics = useIrlAnalytics();

    const searchType = searchParams?.type;
    if (searchType === "upcoming" && !isUpcoming) {
        isUpcoming = true;
    } else if (searchType === "past" && isUpcoming) {
        isUpcoming = false;
    }

    const handleUpcomingGathering = () => {
        isUpcoming = true;
        updateQueryParams('type', 'upcoming', searchParams);
        triggerLoader(true);
        analytics.trackUpcomingEventsButtonClicked(eventDetails.upcomingEvents);
    }

    const handlePastGathering = () => {
        isUpcoming = false;
        updateQueryParams('type', 'past', searchParams);
        triggerLoader(true);
        analytics.trackPastEventsButtonClicked(eventDetails.pastEvents);
    }

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
        analytics.trackAdditionalResourceSeeMoreButtonClicked(eventDetails.resource);
    }

    function getFormattedDate(events: any) {
        const result = getFormattedDateString(events[0]?.startDate, events[events?.length - 1]?.endDate);
        return `Upcoming events from ${result}`;
    }

    function handleJoinPLNetworks() {
        analytics.onJoinPLNetworkClicked(eventDetails);
    }

    return (
        <>
            <div className="root">
                <div className="mob">
                    <div className="root__irl">
                        <div className={`root__irl__events`}>
                            <button
                                className={`root__irl__events__upcoming ${isUpcoming ? 'root__irl__events__active' : 'root__irl__events__inactive'}`}
                                onClick={handleUpcomingGathering}>
                                upcoming
                                <span
                                    className={`root__irl__events__count ${isUpcoming ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}
                                >
                                    {eventDetails?.upcomingEvents?.length}
                                </span>
                            </button>
                            <button
                                className={`root__irl__events__past ${!isUpcoming ? 'root__irl__events__active' : 'root__irl__events__inactive'}`}
                                onClick={handlePastGathering}>
                                past
                                <span
                                    className={`root__irl__events__count ${!isUpcoming ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}
                                >
                                    {eventDetails?.pastEvents?.length}
                                </span>
                            </button>
                        </div>

                        {isUpcoming && eventDetails?.upcomingEvents?.length > 0 &&
                            <div className="root__irl__eventWrapper">
                                <div className="root__irl__eventWrapper__icon"><img src="/images/irl/calendar.svg" alt="calendar" /></div>
                                <div>{getFormattedDate(eventDetails?.upcomingEvents)}</div>
                            </div>}
                    </div>

                    {isUpcoming &&
                        <IrlUpcomingEvents eventDetails={eventDetails} isLoggedIn={isLoggedIn} isUpcoming={isUpcoming} searchParams={searchParams} />
                    }

                    {!isUpcoming &&
                        <IrlPastEvents eventDetails={eventDetails} isLoggedIn={isLoggedIn} isUpcoming={isUpcoming} searchParams={searchParams} />
                    }

                    <div className="root__irl__addRes">
                        <div className="root__irl__addRes__cnt">
                            <div className="root__irl__addRes__cnt__icon">📋</div>
                            <div>Additional resources</div>
                        </div>

                        <div className="root__irl__addRes__cntr">
                            <div className="root__irl__addRes__cntr__resource">
                                {eventDetails?.resources?.slice(0, 3).map((resource: any, index: number) => (
                                    <div key={index} className="root__irl__addRes__cntr__resCnt">
                                        <div style={{ display: "flex" }}>
                                            <img
                                                src="/icons/hyper-link.svg"
                                                alt="icon" />
                                        </div>
                                        <a href={resource?.link} target='_blank'>
                                            {resource?.type}
                                        </a>
                                        <div>
                                            <img
                                                src="/icons/arrow-blue.svg"
                                                alt="arrow icon" />
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

                    {!isLoggedIn &&
                        <div className="root__irl__addRes__loggedOut">
                            <div className="root__irl__addRes__cnt__loggedOut">
                                <div>
                                    <img src="/icons/info-orange.svg" alt="info" />
                                </div>
                                <div>Attending an event but aren&apos;t part of the network yet?</div>
                                <button onClick={handleJoinPLNetworks}>
                                    <a href='https://airtable.com/appHT5ErKdHcsFznj/shryt1Y1xDKZTemJS' target='_blank'>Join</a>
                                </button>
                            </div>
                        </div>
                    }

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
                                            <img
                                                src="/icons/hyper-link.svg"
                                                alt="icon"
                                            />
                                        </div>
                                        <a href={resource?.link} target='_blank'>
                                            {resource?.name}
                                        </a>
                                        <div>
                                            <img
                                                src="/icons/arrow-blue.svg"
                                                alt="arrow icon" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Modal>

                </div>
            </div>
            <style jsx>{`
                .root {
                    color: #0F172A;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: relative;
                }

                .root__irl {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                }

                .root__irl__events {
                    width: 231px;
                    height: 48px;
                    padding: 3px;
                    border-radius: 8px;
                    border: 1px solid #CBD5E1;
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
                }

                .root__irl__events__active {
                    background-color: #156FF7;
                    color: #fff;
                }

                .root__irl__events__inactive {
                    background-color: #fff;
                    color: #0F172A;

                }

                .root__irl__events__upcoming {
                    width: 122px;
                    height:40px;
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
                }
                    
                .root__irl__events__active__count {
                    width: 17px;
                    height: 14px;
                    padding: 0px 5px 0px 5px;
                    gap: 10px;
                    border-radius: 2px ;
                    border: 0.5px solid #fff;
                }

                .root__irl__events__inactive__count {
                    padding: 0px 5px 0px 5px;
                    border-radius: 2px ;
                    border: 0.5px solid transparent;
                    background-color: #F1F5F9;
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
                    border: 1px solid #CBD5E1;
                    width: 301px;
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
                    border-spacing: 5px; 
                }

                .root__irl__table__no-data {
                    border: 1px solid #CBD5E1;
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

                .root__irl__table-col__headerName, .root__irl__table-col__contentName {
                    width: 193px;
                    padding: 10px;
                    border-right: 1px solid #CBD5E1;
                }

                .root__irl__table-col__headerName, .root__irl__table-col__headerDesc ,.root__irl__table-col__headerRes {
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 20px;
                    text-align: left;

                }

                .root__irl__table-col__headerDesc, .root__irl__table-col__contentDesc {
                    width: 566px;
                    padding: 10px;
                    border-right: 1px solid #CBD5E1;
                }

                .root__irl__table-col__headerRes, .root__irl__table-col__contentRes  {
                    width: 91px;
                    padding: 10px;
                }

                .root__irl__table-col__headerName ,
                .root__irl__table-col__headerDesc,
                .root__irl__table-col__headerRes,
                .root__irl__table-col__contentName, 
                .root__irl__table-col__contentDesc,
                .root__irl__table-col__contentRes {
                    padding: 10px;
                }

                .root__irl__table-col__contentRes {
                    display: flex;
                    flex-direction: row;
                    gap: 4px;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 20px;
                    text-align: center;
                    color: #156FF7;
                    cursor: pointer;
                }
                
                .root__irl__table__header {
                    background-color: #F8FAFC;
                }

                .root__irl__addRes ,.root__irl__addRes__loggedOut {
                    display: flex;
                    flex-direction: row;
                    border-radius: 4px;
                    border: 1px solid #CBD5E1;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 20px;
                    text-align: left;
                    align-items: ${!isLoggedIn ? 'center' : 'unset'};
                    justify-content: ${!isLoggedIn ? 'center' : 'unset'};
                }

                .root__irl__addRes {
                    background-color: #F8FAFC;
                    min-height: 36px;
                    padding: 5px;
                }

                .root__irl__addRes__loggedOut {
                    background-color: #FFE2C8;
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
                    width:  45px;
                    height: 30px;
                    padding: 6px 10px 6px 10px;
                    border-radius: 8px ;
                }

                .root__irl__addRes__cnt {
                    display: flex;
                    flex-direction: row;
                    gap:2px;
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

                .root__irl__resPopup, .root__irl__addRes__popup {
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
                    background-color: #FFE2C8;
                    margin-top: 50px;
                    display: flex;
                    flex-direction: row;
                    height: 34px;
                    justify-content: center;
                    align-items: center;
                    border-radius: 8px;
                }

                .root__irl__popup__header__loginBtn {
                    color: #156FF7;
                }

                .root__irl__popupCnt {
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                    width: 594px;
                    height: 48px;
                    padding: 14px 0px 14px 0px;
                    gap: 10px;
                    border-bottom: 1px solid #CBD5E1;
                    color: #156FF7;
                }

                .root__irl__addRes__cntr {
                    display: flex;
                    flex-direction: row;
                    gap: 6px;
                    color: #156FF7;
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
                    border: 1px solid #CBD5E1;
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
                    color: #156FF7;
                    cursor: pointer;
                }

                @media (min-width: 360px) {
                    .root {
                        overflow-x: auto;
                        max-height: 472px;
                        overflow-x: auto;
                        scroll-behavior: smooth;
                        scrollbar-width: none;
                        border-radius: unset;
                    }
                    .mob {
                      display: flex;
                      flex-direction: column;
                      gap: 16px;
                    }

                    .root__irl__resPopup, .root__irl__addRes__popup {
                        width: 90vw;
                        height: 394px;
                    }

                    .root__irl__popupCnt {
                        width: 100%;
                    }

                    .root__irl {
                         width: ${isUpcoming ? '900px' : 'unset'};
                    }

                    .root__irl__addRes {
                        width: ${isUpcoming ? '900px' : 'unset'};
                    }

                    .root__irl__addRes__loggedOut {
                        width: ${isUpcoming ? '900px' : 'unset'};
                    }
                }

                @media (min-width: 1024px) {
                    .root {
                      overflow-x: unset;
                    }
                    .mob {
                      overflow-x: unset;
                      width: 864px;
                    }

                    .root__irl, .root__irl__addRes, .root__irl__addRes__loggedOut {
                        width: unset;
                    }

                    .root__irl__resPopup, .root__irl__addRes__popup {
                        width: 650px;
                        height: 394px;
                    }
                }
            `}</style>
        </>
    )
}

export default IrlEvents;
