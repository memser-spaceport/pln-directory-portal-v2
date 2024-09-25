"use client";

import Modal from "@/components/core/modal";
import { GATHERINGS, PLN_LOCATIONS, RESOURCES } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";

interface IIrlEvents {
    isLoggedIn: boolean;
}

const IrlEvents = (props: IIrlEvents) => {
    const isLoggedIn = props.isLoggedIn;
    const [isUpcoming, setIsUpcoming] = useState(true);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const addResRef = useRef<HTMLDialogElement>(null);

    const handleUpcomingGathering = () => {
        setIsUpcoming(true);
    }

    const handlePastGathering = () => {
        setIsUpcoming(false);
    }

    const onCloseModal = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }

        if (addResRef.current) {
            addResRef.current.close();
        }
    };

    const handleClick = () => {
        if (dialogRef.current) {
            dialogRef.current.showModal();
        }
    }

    const handleAddResClick = () => {
        if (addResRef.current) {
            addResRef.current.showModal();
        }
    }

    return (
        <>
            <div className="root">
                <div className="mob">
                    <div className="root__irl">
                        <div className={`root__irl__events`}>
                            <button
                                className={`root__irl__events__upcoming ${isUpcoming === true ? 'root__irl__events__active' : 'root__irl__events__inactive'}`}
                                onClick={handleUpcomingGathering}>
                                upcoming
                                <span
                                    className={`root__irl__events__count ${isUpcoming === true ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}
                                >
                                    0
                                </span>
                            </button>
                            <button
                                className={`root__irl__events__past ${isUpcoming === false ? 'root__irl__events__active' : 'root__irl__events__inactive'}`}
                                onClick={handlePastGathering}>
                                past
                                <span
                                    className={`root__irl__events__count ${isUpcoming === false ? 'root__irl__events__active__count' : 'root__irl__events__inactive__count'}`}
                                >
                                    20
                                </span>
                            </button>
                        </div>
                        <div className="root__irl__eventWrapper">
                            <div className="root__irl__eventWrapper__icon"><img src="/images/irl/calendar.svg" alt="calendar" /></div>
                            <div>Upcoming events from Jun 10-Jul 04</div>
                        </div>
                    </div>

                    <div className="root__irl__tableContainer">
                        <div className="root__irl__table">
                            {GATHERINGS.length > 0 &&
                                <div className="root__irl__table__header">
                                    <div className="root__irl__table-row__header">
                                        <div className="root__irl__table-col__headerName">Name</div>
                                        <div className="root__irl__table-col__headerDesc">Description</div>
                                        <div className="root__irl__table-col__headerRes">Resource</div>
                                    </div>
                                </div>
                            }
                            {GATHERINGS.length > 0 && GATHERINGS.map((gathering: any, index: number) => (
                                <div key={index} className="root__irl__table-row__content">
                                    <div className="root__irl__table-col__contentName">
                                        <div className="root__irl__table-col__contentName__top">
                                            <div>{gathering.icon}</div>
                                            <div className="root__irl__table-col__contentName__top__title">{gathering.name}</div>
                                        </div>
                                        <div className="root__irl__table-col__contentName__bottom">{gathering.eventDate}</div>
                                    </div>
                                    <div className="root__irl__table-col__contentDesc">{gathering.description}</div>
                                    <div
                                        className="root__irl__table-col__contentRes"
                                        onClick={handleClick}
                                    >
                                        <div><img src="/images/irl/elements.svg" alt="calendar" /></div>
                                        <div style={{ paddingBottom: "4px" }}>view</div>
                                    </div>
                                </div>
                            ))}

                            {GATHERINGS.length === 0 && 
                                <div className="root__irl__table__no-data">
                                    <div><img src="/icons/no-calender.svg" alt="calendar" /></div>
                                    <div>No Gatherings happening currently in this location</div>
                                </div>
                            }
                        </div>
                    </div>

                    <Modal modalRef={dialogRef} onClose={onCloseModal}>
                        <div className="root__irl__resPopup">
                            <div className="root__irl__modalHeader">
                                <div className="root__irl__modalHeader__title">Resources</div>
                                <div className="root__irl__modalHeader__count">(8)</div>
                            </div>
                            <div className="root__irl__popupCntr">
                                {RESOURCES.map((root__irl__popupCnt: any, index: number) => (
                                    <div key={index} className="root__irl__popupCnt">
                                        <div>
                                            <img
                                                src="/icons/hyper-link.svg"
                                                alt="icon"
                                            />
                                        </div>
                                        <div>{root__irl__popupCnt.name}</div>
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

                    <div className="root__irl__addRes">
                        {/* {isLoggedIn && */}
                            <>
                                <div className="root__irl__addRes__cnt">
                                    <div className="root__irl__addRes__cnt__icon">📋</div>
                                    <div>additional resources</div>
                                </div>

                                <div className="root__irl__addRes__cntr">
                                    <div className="root__irl__addRes__cntr__resource">
                                        {RESOURCES.slice(0, 3).map((resource, index) => (
                                            <div key={index} className="root__irl__addRes__cntr__resCnt">
                                                <div>
                                                    <img
                                                        src="/icons/hyper-link.svg"
                                                        alt="icon" />
                                                </div>
                                                <div>{resource.name}</div>
                                                <div>
                                                    <img
                                                        src="/icons/arrow-blue.svg"
                                                        alt="arrow icon" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {RESOURCES.length > 3 && (
                                        <div className="root__irl__addRes__cntr__resCnt__showMore" onClick={handleAddResClick}>
                                            <div>+{RESOURCES.length - 3}</div>
                                            <div>more</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        {/* } */}
                    </div>

                    {!isLoggedIn &&
                        <div className="root__irl__addRes__loggedOut">
                            <div className="root__irl__addRes__cnt__loggedOut">
                                <div>
                                    <img src="/icons/info-orange.svg" alt="info" />
                                </div>
                                <div>Attending an event but aren&apos;t part of the network yet?</div>
                                <button>Join</button>
                            </div>

                        </div>
                    }

                    <Modal modalRef={addResRef} onClose={onCloseModal}>
                        <div className="root__irl__addRes__popup">
                            <div className="root__irl__modalHeader">
                                <div className="root__irl__modalHeader__title">Additional Resources</div>
                                <div className="root__irl__modalHeader__count">(8)</div>
                            </div>
                            <div className="root__irl__popupCntr">
                                {RESOURCES.map((root__irl__popupCnt: any, index: number) => (
                                    <div key={index} className="root__irl__popupCnt">
                                        <div>
                                            <img
                                                src="/icons/hyper-link.svg"
                                                alt="icon"
                                            />
                                        </div>
                                        <div>{root__irl__popupCnt.name}</div>
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
                    // overflow-y: auto;
                    position: relative;
                    max-height: 256px;
                    overflow: auto;
                    scroll-behavior: smooth;
                    // scrollbar-width: thin;

                }

                .root__irl__table {
                    display: flex;  
                    flex-direction: column;
                    justify-content: space-between;       
                    width: 99.5%;         
                    background-color: #fff;         
                    // border: 1px solid #CBD5E1;         
                    border-spacing: 5px; 
                    // padding: 20px 0 20px 0;
                }

                .root__irl__table__no-data {
                    border: 1px solid #CBD5E1;
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                    justify-content: center;
                    height: 54px;
                    align-items: center;
                    font-family: Inter;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 15px;
                    // text-align: center;
                    width: 864px;

                }    

                .root__irl__table-row__header {
                    border: 1px solid #CBD5E1;
                }

                .root__irl__table-row__header , .root__irl__table-row__content {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    height: 40px;
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
                    height: 54px;
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

                .root__irl__table-col {
                //   float: left; 
                //   display: table-column;         
                //   width: 100%;         
                //   background-color: #ccc;  
                }

                .root__irl__addRes ,.root__irl__addRes__loggedOut {
                    display: flex;
                    flex-direction: row;
                    // width: 860px;
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
                    background-color: #fff; // ${!isLoggedIn ? '#FFE2C8' : '#fff'};
                    // justify-content: ${!isLoggedIn ? 'center' : 'unset'};
                    // align-items: ${!isLoggedIn ? 'center' : 'unset'};
                    height: 36px;
                }

                .root__irl__addRes__loggedOut {
                    background-color: #FFE2C8; // ${!isLoggedIn ? '#FFE2C8' : '#fff'};
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
                    margin-top: 44px;
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
                        // height: 412px;
                        max-height: 472px;
                        overflow-x: auto;
                        scroll-behavior: smooth;
                        scrollbar-width: none;
                        border-radius: unset;
                    }
                    .mob {
                    //   overflow-x: auto;
                    //   scroll-behavior: smooth;
                    //   scrollbar-width: none;
                    //   border-radius: unset;
                    //   position: absolute;
                      display: flex;
                      flex-direction: column;
                      gap: 16px;
                      width: 900px;
                    }

                    .root__irl__resPopup, .root__irl__addRes__popup {
                        width: 90vw;
                        // height: 70vh;
                        // width: 320px;
                        height: 394px;
                        // padding: 25px;
                    }

                    .root__irl__popupCnt {
                        width: 500px;
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

                    .root__irl__resPopup, .root__irl__addRes__popup {
                        // width: 90vw;
                        // height: 70vh;
                        width: 650px;
                        height: 394px;
                        // padding: 25px;
                    }
                }
            `}</style>
        </>
    )
}

export default IrlEvents;
