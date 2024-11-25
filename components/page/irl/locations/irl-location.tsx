"use client";

import IrlLocationCard from "./irl-location-card";
import { useEffect, useRef, useState } from "react";
import React from "react";
import Modal from "@/components/core/modal";
import { triggerLoader } from "@/utils/common.utils";
import { useIrlAnalytics } from "@/analytics/irl.analytics";
import { useRouter } from "next/navigation";
import { ILocationDetails } from "@/types/irl.types";
import useClickedOutside from "@/hooks/useClickedOutside";
import IrlLocationPopupView from "./irl-location-popupView";
import IrlSeeMoreLocationCard from "./irl-see-more-location-card";

interface IrlLocation {
    locationDetails: ILocationDetails[];
    searchParams: any;
}

const IrlLocation = (props: IrlLocation) => {
    const [activeLocationId, setActiveLocationId] = useState<string|null>(null);
    const [locations, setLocations] = useState(props.locationDetails);
    const [showMore, setShowMore] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const searchParams = props?.searchParams;
    const analytics = useIrlAnalytics();
    const router = useRouter();
    const locationRef = useRef<HTMLDivElement>(null);
    const [cardLimit, setCardLimit] = useState(4);

    const onCloseModal = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }
    };

    useEffect(() => {
        const updateCardLimit = () => {
            setCardLimit(window.innerWidth < 1440 ? 4 : 6);
        };

        updateCardLimit();
        window.addEventListener('resize', updateCardLimit);

        return () => window.removeEventListener('resize', updateCardLimit);
    }, []);

    useEffect(() => {
        const showCardLimit = window.innerWidth < 1440 ? 3 : 5;
        if (searchParams?.location) {
            const locationName = searchParams.location;
            const locationDataIndex = locations.findIndex(
                (loc) => loc.location.split(",")[0].trim() === locationName
            );

            if (locationDataIndex >= 0) {
                if (locationDataIndex >= showCardLimit) {
                    const updatedLocations = [...locations];
                    [updatedLocations[locationDataIndex], updatedLocations[showCardLimit]] =
                    [updatedLocations[showCardLimit], updatedLocations[locationDataIndex]];
                    setActiveLocationId(updatedLocations[showCardLimit].uid);
                    setLocations(updatedLocations);
                    analytics.trackSeeOtherLocationClicked(updatedLocations[showCardLimit]);
                } else {
                    setActiveLocationId(locations[locationDataIndex].uid);
                }
            }
        }
    }, [searchParams]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            if (dialogRef.current) {
                dialogRef.current.showModal();
            }
        }
        setShowMore(!showMore);
        analytics.trackSeeOtherLocationClicked(locations?.slice(cardLimit));
    }

    const setSearchParams = (
        locationDetail: any,
        currentParams: URLSearchParams,
        searchParams: any
    ) => {
        const hasPastEvents = locationDetail?.pastEvents?.length > 0;
        const hasUpcomingEvents = locationDetail?.upcomingEvents?.length > 0;
        const isTypePast = searchParams?.type === 'past';
        const isTypeUpcoming = searchParams?.type === 'upcoming';

        currentParams.set('location', locationDetail?.location?.split(",")[0].trim());

        if (!searchParams?.type) {
            if (hasUpcomingEvents && !hasPastEvents) currentParams.set('type', 'upcoming');
            else if (hasPastEvents && !hasUpcomingEvents) setPastEvent();
            else if (hasUpcomingEvents && hasPastEvents) {
                currentParams.delete('type');
                currentParams.delete('event');
            }
        } else if (hasPastEvents && hasUpcomingEvents) {
            currentParams.delete('type');
            currentParams.delete('event');
        } else if (hasPastEvents && isTypePast) setPastEvent();
        else if (!hasPastEvents && isTypePast) switchToUpcoming();
        else if (!hasUpcomingEvents && isTypeUpcoming) setPastEvent();
        else currentParams.delete('event');

        function setPastEvent() {
            currentParams.set('type', 'past');
            currentParams.set('event', locationDetail.pastEvents[0]?.slugURL);
        }

        function switchToUpcoming() {
            currentParams.set('type', 'upcoming');
            currentParams.delete('event');
        }
    };

    const handleCardClick = (locationDetail: any) => {
        const currentParams = new URLSearchParams(searchParams);
        const allowedParams = ['event', 'type', 'location']; 
    
        // Remove parameters not in the allowed list
        for (const [key, value] of Object.entries(searchParams)) {
          if (!allowedParams.includes(key)) {
            currentParams.delete(key);
          }
        }
      

        setSearchParams(locationDetail, currentParams, searchParams);

        const locationChanged = locationDetail?.location?.split(",")[0].trim() !== searchParams?.location;
        if (locationChanged) {
            router.push(`${window.location.pathname}?${currentParams.toString()}`);
            triggerLoader(true);
            analytics.trackLocationClicked(locationDetail?.uid, locationDetail?.location);
        }
    };

    const handleResourceClick = (clickedLocation: any) => {
        const clickedIndex = locations.findIndex(({ uid }) => uid === clickedLocation.uid);
        if (clickedIndex === -1) return;
        triggerLoader(true);

        // const updatedLocations = [...locations];
        // const fourthIndex = cardLimit - 1;

        // // Swap locations
        // [updatedLocations[clickedIndex], updatedLocations[fourthIndex]] =
        //     [updatedLocations[fourthIndex], updatedLocations[clickedIndex]];

        const currentParams = new URLSearchParams(searchParams);
        const allowedParams = ['event', 'type', 'location']; 
    
        // Remove parameters not in the allowed list
        for (const [key, value] of Object.entries(searchParams)) {
          if (!allowedParams.includes(key)) {
            currentParams.delete(key);
          }
        }
        setSearchParams(clickedLocation, currentParams, searchParams);

        router.push(`${window.location.pathname}?${currentParams.toString()}`);

        dialogRef.current?.close();
        // setLocations(updatedLocations);
        setShowMore(false);

        analytics.trackLocationClicked(clickedLocation.uid, clickedLocation?.location);
    };


    useClickedOutside({
        ref: locationRef,
        callback: () => {
            setShowMore(false);
        },
    });

    return (
        <>
            <div className="root">
                <div className="root__card">
                    {locations?.slice(0, 4).map((location: any, index: any) => (
                        <IrlLocationCard
                            key={location.uid}
                            {...location}
                            isActive={activeLocationId ? activeLocationId === location.uid : index === 0}
                            onCardClick={() => handleCardClick(location)}
                        />
                    ))}
                </div>

                <div className="root__card__desktop-sm">
                    {locations?.slice(0, 6).map((location: any, index: any) => (
                        <IrlLocationCard
                            key={location.uid}
                            {...location}
                            isActive={activeLocationId ? activeLocationId === location.uid : index === 0}
                            onCardClick={() => handleCardClick(location)}
                        />
                    ))}
                </div>

                <div className="root__irl__seeMoreCard__desktop--sm">
                    {locations?.length > 4 &&
                        <IrlSeeMoreLocationCard
                            count={4}
                            handleClick={handleClick}
                            locations={locations}
                            locationRef={locationRef} />
                    }
                </div>
                <div className="root__irl__seeMoreCard__desktop--lg">
                    {locations?.length > cardLimit &&
                        <IrlSeeMoreLocationCard
                            count={cardLimit}
                            handleClick={handleClick}
                            locations={locations}
                            locationRef={locationRef} />
                    }
                </div>

                {/* {showMore &&
                    <div className="root__irl__seeMoreCard__desktop--sm">
                        <div className="root__irl__overlay">
                            {locations?.slice(4).map((location: ILocationDetails, index: React.Key | null | undefined) => (
                                <IrlLocationPopupView
                                    key={location.location}
                                    location={location}
                                    handleResourceClick={handleResourceClick} />
                            ))}
                        </div>
                    </div>
                } */}

                {showMore &&
                    <div className="root__irl__seeMoreCard__desktop--lg">
                        <div className="root__irl__overlay">
                            {locations?.slice(cardLimit).map((location: ILocationDetails, index: React.Key | null | undefined) => (
                                <IrlLocationPopupView
                                    key={location.location}
                                    location={location}
                                    handleResourceClick={handleResourceClick} />
                            ))}
                        </div>
                    </div>
                }

                <div className="root__irl__mobileView">
                    <Modal modalRef={dialogRef} onClose={onCloseModal}>
                        <div className="root__irl__header"> Select a location</div>
                        <div className="root__irl__mobileModal">
                            {locations?.slice(4).map((location: { flag: any; location: any; upcomingEvents: any; pastEvents: any }, index: React.Key | null | undefined) => (
                                <div key={index} className="root__irl__mobileModal__cnt" onClick={() => handleResourceClick(location)}>
                                    <div className="root__irl__mobileModal__cnt__location">
                                        <div><img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} /></div>
                                        <div>{location.location.split(",")[0].trim()}</div>
                                    </div>
                                    <div className="root__irl__mobileModal__cnt__events">
                                        {location.upcomingEvents?.length > 0 &&
                                            <>
                                                <span>{location.upcomingEvents?.length ?? 0}</span>{' '} Upcoming
                                            </>
                                        }
                                        {location.pastEvents?.length > 0 &&
                                            <>
                                                <span>{location.pastEvents?.length ?? 0}</span>{' '} Past

                                            </>
                                        }
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
                // display: grid;
                // grid-template-columns: repeat(4, 1fr); /* Default: 4 cards */
                // gap: 16px;
              }
              .show-more {
                  /* Add styles for showing the rest of the data */
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
                    width: 170px;
                    max-height: 196px;
                    top: 156px;
                    right: 4px;
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
                    flex-direction: column;
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

                .root__irl__overlay__cnt__location__icon, .root__irl__overlay__cnt__location__title {
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

                .root__irl__seeMoreCard__desktop--sm {
                    display: flex;
                }

                @media (min-width: 360px) {
                    .root {
                        height: 100px;
                    }
                    .root__irl__expanded{
                        width: 140px;
                        height: 100px;
                        gap: 5px;
                        background: 
                            linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%);
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

                    .root__irl__seeMoreCard__desktop--lg, .root__card__desktop-sm  {
                        display: none;
                    }
                }

                @media (min-width: 1024px) {

                    .root__irl__seeMoreCard__desktop--sm {
                        display: none;
                    }
                    .root__irl__seeMoreCard__desktop--lg {
                        display: flex;
                        // margin-left: 10px;
                    }

                    .root__irl__openModal, .root__irl__overlay {
                        display: flex;
                        flex-direction: column;
                    }

                    .root__irl__overlay {
                        overflow-y: auto;
                    }
                    .root__irl__expanded {
                        width: 161px;
                        height: 150px;
                        background: 
                            linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%), 
                            url("/images/irl/Clouds v2.svg");
                        background-size: cover; 
                        background-blend-mode: overlay; 
                        gap: 5px;
                        transition: background-position 4s; /* Smooth transition */
                    }

                    .root__irl__expanded:hover {
                        animation: moveBackground 4s linear forwards; /* Ensure keyframes are defined */
                    }

                    @keyframes moveBackground {
                        0% {
                            background-position: 0% 0%;
                        }
                        100% {
                            background-position: 100% 100%;
                        }
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

                    .root__card__desktop-sm {
                        display: none;
                    }
                }

                @media (min-width: 1440px) {
                    .root__card {
                        display: none;
                        // display: grid;
                        // grid-template-columns: repeat(6, 1fr);
                        // gap: 15px;
                    }

                    .root__card__desktop-sm {
                        display: flex;
                        flex-direction: row;
                        gap: 15px;
                    }

                    .root {
                        width: 159.43px;
                        height: 137px;
                        gap: 14px;
                    }

                    .root__irl__overlay {
                        width: 174px;
                    }
                }

                @media (min-width: 1920px) {
                    .root__irl__expanded {
                        align-items: center;
                        width: 225px;
                        background: 
                        linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%), 
                        url("/images/irl/2560 animation asset v3.2.svg");
                    }
                    .root__irl__overlay {
                        width: 232px;
                        right: 9px;
                    }
                }

                @media (min-width: 2560px) {
                    .root__irl__expanded {
                        width: 305px;
                        height: 150px;
                    }
                    .root__irl__overlay {
                        width: 306px;
                    }
                }
            `}
            </style>
        </>
    );
}

export default IrlLocation;