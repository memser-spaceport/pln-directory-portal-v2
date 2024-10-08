"use client";

import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { useRef, useState } from 'react';
import IrlEventsPopupOverlay from './irl-events-popup-overlay';
import IrlEventsTableView from './irl-events-table-view';
import { useRouter } from 'next/navigation';
import { useIrlAnalytics } from '@/analytics/irl.analytics';

interface EventDetailsProps {
    eventDetails: {
        upcomingEvents: Array<any>;
        pastEvents: Array<any>;
    };
    isLoggedIn: boolean;
    isUpcoming: boolean;
    // handleClick: (resources: any, eventsToShow: any) => () => void;
    searchParams: any;
}

const IrlUpcomingEvents = ({ eventDetails, isLoggedIn, isUpcoming, searchParams }: EventDetailsProps) => {
    // const eventsToShow = isUpcoming ? eventDetails?.upcomingEvents : eventDetails?.pastEvents;
    const eventType = isUpcoming ? 'Upcoming Events' : 'Past Events';
    const { updateQueryParams } = useUpdateQueryParams();
    let eventsToShow: any = [];
    const limit = 4;
    const [isExpanded, setExpanded] = useState(false);
    const [itemsToShow, setItemsToShow] = useState(4);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [resources, setResources] = useState([]);
    const analytics = useIrlAnalytics();
    const router = useRouter();

    if (eventDetails) {
        // Determine events to show based on upcoming or past
        const events = isUpcoming ? eventDetails.upcomingEvents : eventDetails.pastEvents;
        // Sort upcomingEvents based on duration and then by start date
        const sortedUpcoming = events.sort((a: any, b: any) => {
            const durationA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
            const durationB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();

            // Compare by duration first, then by start date
            return durationB - durationA || new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

        eventsToShow = sortedUpcoming;
    }

    const toggleDescription = () => {
        setExpanded(!isExpanded);
        setItemsToShow(isExpanded ? 4 : itemsToShow + 4);
    };

    const onCloseModal = () => {
        if (dialogRef.current) {
            (dialogRef.current as any as HTMLDialogElement).close();
        }
    };

    const handleAdditionalResourceClick = (resources: any) => {
        analytics.trackAdditionalResourceClicked(resources);
    }

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
        // analytics.onLoginClicked(eventDetails);

    }


    return (
        <>
            <div className="root__irl__tableContainer">
                <div className="root__irl__table">
                    {eventsToShow?.length > 0 ? (
                        <>
                            <div className="root__irl__table__header">
                                <div className="root__irl__table-row__header">
                                    <div className="root__irl__table-col__headerName">Name</div>
                                    <div className="root__irl__table-col__headerDesc">Description</div>
                                    <div className="root__irl__table-col__headerRes">Resource</div>
                                </div>
                            </div>
                            <div className='root__irl__desktop__view'>
                                {eventsToShow?.map((gathering: any, index: number) => (
                                    <IrlEventsTableView key={index} gathering={gathering} handleClick={handleClick} eventsToShow={eventsToShow} />
                                ))}
                            </div>
                            <div className='root__irl__mobile__view'>
                                {eventsToShow?.slice(0, itemsToShow)?.map((gathering: any, index: number) => (
                                    <IrlEventsTableView key={index} gathering={gathering} handleClick={handleClick} eventsToShow={eventsToShow} />
                                ))}
                            </div>
                            {eventsToShow?.length > 4 &&
                                <div className='root__irl__mobileView' onClick={toggleDescription}>
                                    {isExpanded ? ' Show Less' : ' Show More'}
                                    <div className='root__irl__mobileView__icon'>
                                        {!isExpanded ?
                                            <img src="/icons/arrow-blue-down.svg" alt="down-arrow" />
                                            :
                                            <img src="/icons/chevron-up.svg" alt="up-arrow" className='root__irl__mobileView__icon__up' />
                                        }
                                    </div>
                                </div>
                            }
                        </>
                    ) : (
                        <div className="root__irl__table__no-data">
                            <div><img src="/icons/no-calender.svg" alt="calendar" /></div>
                            <div>No {eventType} currently in this location</div>
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

                .root__irl__table-row__header {
                    border: 1px solid #CBD5E1;
                }

                .root__irl__table-row__header , .root__irl__table-row__content {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    min-height: 40px;
                    clear: both;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 20px;
                    text-align: left;
                }

                .root__irl__table-row__content {
                    border-top: none;
                    border-right: 1px solid #CBD5E1;
                    border-bottom: 1px solid #CBD5E1;
                    border-left: 1px solid #CBD5E1;
                    min-height: 54px;
                }
                    
                .root__irl__table-row__content--active {
                    background-color: rgba(219, 234, 254, 0.5);
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
                    background-color: #fff;
                    height: 36px;
                }

                .root__irl__addRes__loggedOut {
                    background-color: #FFE2C8; 
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

                .root__irl__mobileView__icon {
                    display: flex;
                    height: 20px;
                    width: 20px;
                }

                .root__irl__mobileView__icon__up {
                    color: #156FF7;
                    height: 20px;
                    weight: 20px;
                }

                @media screen and (min-width: 360px) {
                    .root__irl__mobileView {
                        width: 100%;
                        height: 35px;
                        border: 1px solid #CBD5E1;
                        background-color: #DBEAFE;
                        display: flex;
                        flex-direction: row;
                        padding-left: 8px;
                        color: #156FF7;
                        font-size: 13px;
                        font-weight: 500;
                        line-height: 20px;
                        text-align: left;
                        align-items: center;
                    }

                    .root__irl__tableContainer {
                        position: relative;
                        max-height: 256px;
                        overflow: auto;
                        scroll-behavior: smooth;
                        width: 900px;
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
                    .root__irl__mobileView {
                        display: none;
                    }

                    .root__irl__tableContainer {
                        width: unset;
                    }

                    .root__irl__mobile__view {
                        display: none;
                    }

                    .root__irl__desktop__view {
                        display: flex;
                        flex-direction: column;
                    }
                }
            `}</style>
        </>

    );
};


export default IrlUpcomingEvents;

