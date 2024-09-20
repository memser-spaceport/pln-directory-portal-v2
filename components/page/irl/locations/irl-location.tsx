"use client";

import { PLN_LOCATIONS } from "@/utils/constants";
import IrlLocationCard from "./irl-location-card";
import { useRef, useState } from "react";
import React from "react";
import Modal from "@/components/core/modal";

const IrlLocation = () => {
    const startIndex = 4;
    const endIndex = 7;
    const filteredLocations = PLN_LOCATIONS.slice(startIndex, endIndex);
    const [showMore, setShowMore] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const onCloseModal = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };

    const handleClick = () => {
        if (window.innerWidth < 1024) {
            if (dialogRef.current) {
                dialogRef.current.showModal();
            }
        }
        setShowMore(!showMore);
        console.log(showMore, 'showMore');
    }

    return (
        <>
            <div className="root">
                <div className="root__card">
                    {PLN_LOCATIONS.slice(0, 4).map((location, index) => (
                        <IrlLocationCard key={index} {...location} />
                    ))}
                </div>
                <div className="root__irl__expanded" onClick={handleClick}>
                    <div
                        className="root__irl__expanded__showMore"
                    >
                        See Other Locations
                    </div>
                    <div className="root_irl__expanded__imgcntr">
                        {filteredLocations.map((location, index) => (
                            <div key={index} className="root_irl__expanded__imgcntr__img">
                                <div dangerouslySetInnerHTML={{ __html: location.flag }} />
                            </div>
                        ))}
                    </div>
                    <div className="root__irl__expanded__icon">
                        <img src="/images/irl/upsideCap.svg" alt="downArrow" />
                    </div>
                </div>

                {showMore &&
                    <div className="root__irl__overlay">
                        {PLN_LOCATIONS.slice(4).map((location, index) => (
                            <div key={index} className="root__irl__overlay__cnt">
                                <div className="root__irl__overlay__cnt__location">
                                    <div dangerouslySetInnerHTML={{ __html: location.flag }} />
                                    <div>{location.location}</div>
                                </div>
                                <div className="root__irl__overlay__cnt__events">
                                    <div><span>{location.upcomingEvents}</span>{' '} Upcoming Events </div>
                                    <div><span>{location.pastEvents}</span>{' '} Past Events </div>
                                </div>
                            </div>
                        ))}
                    </div>
                }
                <div className="root__irl__mobileView">
                    <Modal modalRef={dialogRef} onClose={onCloseModal}>
                        <div className="root__irl__header"> Select a location</div>
                        <div className="root__irl__mobileModal">
                            {PLN_LOCATIONS.slice(4).map((location, index) => (
                                <div key={index} className="root__irl__mobileModal__cnt">
                                    <div className="root__irl__mobileModal__cnt__location">
                                        <div dangerouslySetInnerHTML={{ __html: location.flag }} />
                                        <div>{location.location}</div>
                                    </div>
                                    <div className="root__irl__mobileModal__cnt__events">
                                        <div><span>{location.upcomingEvents}</span>{' '} Upcoming Events </div>
                                        <div><span>{location.pastEvents}</span>{' '} Past Events </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Modal>
                </div>
            </div>
            <style jsx>
                {`
              .root {
                  color: black;
                  display: flex;
                  flex-direction: row;
                  gap: 15px;
              }

              .root__card {
                    display: flex;
                    flex-direction: row;
                    gap: 15px;
              }
              .show-more {
                  /* Add styles for showing the rest of the data */
              }

              .root__irl__expanded {
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                    background-color: #D0E7FA;
                    width: 161px;
                    height: 150px;
                    justify-content: center;
                    text-align: center;
                    border-radius: 8px;
                    border: 1px solid #156FF7;
                    position: relative;
                }

                .root__irl__expanded:hover {
                    position: relative;
                    animation: moveBackground 4s forwards;
                    
                }

               @keyframes moveBackground {
                    0% {
                        background-position: 0 0; /* Start position */
                    }
                    100% {
                        background-position: 100% 0; /* Move the image horizontally to the right */
                    }
                }

                .root__irl__expanded__showMore {
                    font-size: 13px;
                    font-weight: 500;
                    line-height: 14px;
                    text-align: center;
                }

                .root_irl__expanded__imgcntr {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                    justify-content: center
                    // padding: 8px 0px 8px 0px;
                }

                .root_irl__expanded__imgcntr__img {
                    background-color: #ffffff;
                    border-radius: 100%;
                    width: 32px;
                    height: 32px;
                    padding:  5px 0px 5px 0px;
                    gap: 10px;
                    border: 1px solid #CBD5E1;
                }

                .root__irl__overlay {
                    background-color: #fff;
                    width: 367px;
                    height: 196px;
                    top: 156px;
                    right: 8px;
                    gap: 0px;
                    -webkit-border-radius: 12px;
                    -moz-border-radius: 12px;
                    border-radius: 12px;
                    position: absolute;
                    z-index: 4;
                    padding: 10px;
                }

                .root__irl__overlay__cnt {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 5px;
                    color: #0F172A;
                }

                .root__irl__overlay__cnt__location, 
                .root__irl__overlay__cnt__events {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                }

                .root__irl__overlay__cnt__location {
                    width: 50px;
                    height: 28px;
                    gap: 4px;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 28px;
                    text-align: left;
                    color: #0F172A;
                }

                .root__irl__overlay__cnt__events {
                    font-family: Inter;
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 14px;
                    text-align: left;
                    color: #475569;
                    align-items: center;
                }

                .root__irl__overlay__cnt__events span {
                    color: #156FF7;
                }

                .root__irl__mobileModal__cnt__events span {
                    color: #156FF7;
                } 

                .root__irl__header {
                    padding: 15px;
                    font-family: Inter;
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 14px;
                }

                .root__irl__mobileModal {
                    display: flex;  
                    flex-direction: column;
                    // padding: 40px 0 40px 0;

                }

                .root__irl__mobileModal__cnt {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #CBD5E1;
                }

                .root__irl__mobileModal__cnt__location, 
                .root__irl__mobileModal__cnt__events {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                }

                .root__irl__mobileModal__cnt__location {
                    font-size: 18px;
                    font-weight: 600;
                    line-height: 22px;
                    text-align: left;
                }

                @media (min-width: 360px) {
                    .root {
                        height: 100px;
                    }
                    .root__irl__expanded{
                        width: 140px;
                        height: 100px;
                        background-image: none;
                        gap: 5px;
                    }

                    .root_irl__expanded__imgcntr__img {
                        width: 29px;
                        height: 29px;
                        font-size: 14px;
                    }

                    .root__irl__expanded__showMore {
                        width: 140px;
                        margin-top: 10px;
                        padding-bottom: 4px;
                    }

                    .root__irl__openModal, .root__irl__overlay {
                        display: none;
                    }

                    .root__irl__mobileModal, .root__irl__mobileView {
                        display: flex;
                        width: 90vw;
                        height: 70vh;
                        overflow-y: auto;
                    }
                }

                @media (min-width: 1024px) {
                    .root__irl__openModal, .root__irl__overlay {
                        display: flex;
                        flex-direction: column;
                    }

                    .root__irl__overlay {
                        overflow-y: auto;
                    }
                    .root__irl__expanded{
                        width: 161px;
                        height: 150px;
                        background-image: url("/images/irl/Clouds.svg");
                        gap: 5px;
                    }

                    .root_irl__expanded__imgcntr {
                        gap: 10px;
                    }

                    .root_irl__expanded__imgcntr__img {
                        width: 32px;
                        height: 32px;
                        ont-size: 16px;
                        padding:  5px 0px 5px 0px;
                    }

                    .root__irl__expanded__showMore {
                        width: 161px;
                        margin-top: 20px;
                        padding-bottom: 0px;
                    }

                    .root__irl__mobileModal, .root__irl__mobileView {
                        display: none;
                    }
                }
            `}
            </style>
        </>
    );
}

export default IrlLocation;