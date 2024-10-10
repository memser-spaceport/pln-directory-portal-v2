"use client";

import IrlLocationCard from "./irl-location-card";
import { useRef, useState } from "react";
import React from "react";
import Modal from "@/components/core/modal";
import useUpdateQueryParams from "@/hooks/useUpdateQueryParams";
import { triggerLoader } from "@/utils/common.utils";
import { useIrlAnalytics } from "@/analytics/irl.analytics";
import { useRouter } from "next/navigation";

const IrlLocation = (props: any) => {
    const { updateQueryParams } = useUpdateQueryParams();
    let activeLocationId: any = null
    const [locations, setLocations] = useState(props.locationDetails);
    const [showMore, setShowMore] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const searchParams = props?.searchParams;
    const analytics = useIrlAnalytics();
    const router = useRouter();

    const onCloseModal = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };

    if (searchParams?.location) {
        const locationName = searchParams.location;
        const locationDataIndex = locations?.findIndex(
            (loc: { location: string; }) => loc.location.split(",")[0].trim() === locationName
        );

        if (locationDataIndex >= 0) {
            if (locationDataIndex >= 4) {
                [locations[3], locations[locationDataIndex]] = [locations[locationDataIndex], locations[3]];
                activeLocationId = locations[3].uid;
                analytics.trackSeeOtherLocationClicked(locations[3]);
            } else {
                activeLocationId = locations[locationDataIndex].uid;
            }
        }
    }

    const handleClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            if (dialogRef.current) {
                dialogRef.current.showModal();
            }
        }
        setShowMore(!showMore);
        analytics.trackSeeOtherLocationClicked(locations.slice(4));
    }

    const handleCardClick = (locationDetail: any) => {
        activeLocationId = locationDetail?.uid;
        const currentParams = new URLSearchParams(searchParams);

        // Add or update the new search parameters
        currentParams.set('location', locationDetail?.location?.split(",")[0].trim());
        if (locationDetail?.pastEvents?.length > 0 && searchParams?.type === 'past') {
            currentParams.set('event', locationDetail?.pastEvents[0]?.slugURL);
        } else {
            currentParams.delete('event');
        }

        if (locationDetail?.location?.split(",")[0].trim() !== searchParams?.location) {
            router.push(`${window.location.pathname}?${currentParams.toString()}`);
            triggerLoader(true);
            analytics.trackLocationClicked(locationDetail?.uid, locationDetail?.location);
        }
    };

    const handleResourceClick = (clickedLocation: any) => {
        const clickedIndex = locations.findIndex((location: { uid: any }) => location.uid === clickedLocation.uid);
        const fourthIndex = 3;

        if (clickedIndex !== -1 && clickedIndex !== fourthIndex) {
            const updatedLocations = [...locations];

            if (activeLocationId === locations[fourthIndex].uid) {
                [updatedLocations[clickedIndex], updatedLocations[fourthIndex]] =
                    [updatedLocations[fourthIndex], updatedLocations[clickedIndex]];

                activeLocationId = updatedLocations[fourthIndex].uid;
                updateQueryParams('location', updatedLocations[fourthIndex].location.split(",")[0].trim(), searchParams);
                analytics.trackLocationClicked(updatedLocations[fourthIndex].uid, updatedLocations[fourthIndex].location);
            } else {
                [updatedLocations[clickedIndex], updatedLocations[fourthIndex]] =
                    [updatedLocations[fourthIndex], updatedLocations[clickedIndex]];
                analytics.trackLocationClicked(updatedLocations[fourthIndex].uid, updatedLocations[fourthIndex].location);
            }
            setLocations(updatedLocations);
        }
        if (dialogRef.current) {
            dialogRef.current.close();
        }
        setShowMore(false);
    };

    return (
        <>
            <div className="root">
                <div className="root__card">
                    {locations.slice(0, 4).map((location: any, index: any) => (
                        <IrlLocationCard
                            key={location.uid}
                            {...location}
                            isActive={activeLocationId ? activeLocationId === location.uid : index === 0}
                            onCardClick={() => handleCardClick(location)}
                        />
                    ))}
                </div>
                {locations.length > 4 &&
                    <div
                        className="root__irl__expanded"
                        onClick={handleClick}
                    >
                        <div
                            className="root__irl__expanded__showMore"
                        >
                            See Other Locations
                        </div>
                        <div className="root_irl__expanded__imgcntr">
                            {locations.slice(4, 7).map((location: { flag: any; }, index: React.Key | null | undefined) => (
                                <div key={index} className="root_irl__expanded__imgcntr__img">
                                    <img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} />
                                </div>
                            ))}
                        </div>
                        <div className="root__irl__expanded__icon">
                            <img src="/images/irl/upsideCap.svg" alt="downArrow" />
                        </div>
                    </div>
                }

                {showMore &&
                    <div className="root__irl__overlay">
                        {locations.slice(4).map((location: { id: any, flag: any; location: any; upcomingEvents: any; pastEvents: any }, index: React.Key | null | undefined) => (
                            <div key={index} className="root__irl__overlay__cnt" onClick={() => handleResourceClick(location)}>
                                <div className="root__irl__overlay__cnt__location">
                                    <div className="root__irl__overlay__cnt__location__icon"><img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} /></div>
                                    <div>{location.location.split(",")[0].trim()}</div>
                                </div>
                                <div className="root__irl__overlay__cnt__events">
                                    <div><span>{location.upcomingEvents?.length ?? 0}</span>{' '} Upcoming Events </div>
                                    <div><span>{location.pastEvents?.length ?? 0}</span>{' '} Past Events </div>
                                </div>
                            </div>
                        ))}
                    </div>
                }
                <div className="root__irl__mobileView">
                    <Modal modalRef={dialogRef} onClose={onCloseModal}>
                        <div className="root__irl__header"> Select a location</div>
                        <div className="root__irl__mobileModal">
                            {locations.slice(4).map((location: { flag: any; location: any; upcomingEvents: any; pastEvents: any }, index: React.Key | null | undefined) => (
                                <div key={index} className="root__irl__mobileModal__cnt" onClick={() => handleResourceClick(location)}>
                                    <div className="root__irl__mobileModal__cnt__location">
                                        <div><img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} /></div>
                                        <div>{location.location.split(",")[0].trim()}</div>
                                    </div>
                                    <div className="root__irl__mobileModal__cnt__events">
                                        <div><span>{location.upcomingEvents?.length ?? 0}</span>{' '} Upcoming Events </div>
                                        <div><span>{location.pastEvents?.length ?? 0}</span>{' '} Past Events </div>
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
                    animation:moveBackground 4s forwards  // 
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
                    font-size: 12px;
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
                    padding:  4px 0px 0px;
                    gap: 10px;
                    border: 1px solid #CBD5E1;
                }

                .root__irl__overlay {
                    background-color: #fff;
                    width: 367px;
                    max-height: 196px;
                    top: 156px;
                    right: 8px;
                    gap: 0px;
                    -webkit-border-radius: 12px;
                    -moz-border-radius: 12px;
                    border-radius: 12px;
                    position: absolute;
                    z-index: 4;
                    padding: 10px;
                    box-shadow: 0px 4px 4px 0px #0F172A0A;
                }

                .root__irl__overlay__cnt {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 5px;
                    color: #0F172A;
                    cursor: pointer;
                }

                .root__irl__overlay__cnt:hover {
                    background-color: #F7FAFC;
                }

                .root__irl__overlay__cnt__location, 
                .root__irl__overlay__cnt__events {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                }

                .root__irl__overlay__cnt__location {
                    max-width: 141px;
                    min-height: 28px;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 24px;
                    text-align: left;
                    color: #0F172A;
                }

                .root__irl__overlay__cnt__location__icon {
                    display: flex;
                    align-items: center;
                }

                .root__irl__overlay__cnt__events {
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
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 14px;
                }

                .root__irl__mobileModal {
                    display: flex;  
                    flex-direction: column;
                }

                .root__irl__mobileModal__cnt {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    margin: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #CBD5E1;
                    cursor: pointer;
                }

                .root__irl__mobileModal__cnt:hover {
                   background-color: #F7FAFC;
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
                        margin-top: 6px;
                        padding-bottom: 1px;
                    }

                    .root__irl__openModal, .root__irl__overlay {
                        display: none;
                    }

                    .root__irl__mobileModal, .root__irl__mobileView {
                        display: flex;
                        width: 90vw;
                        max-height: 70vh;
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
                        background-image: url("/images/irl/Clouds v2.svg");
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
                        margin-top: 10px;
                        padding-bottom: 6px;
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