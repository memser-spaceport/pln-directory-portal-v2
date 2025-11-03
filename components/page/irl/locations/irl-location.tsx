'use client';

import IrlLocationCard from './irl-location-card';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import Modal from '@/components/core/modal';
import { triggerLoader } from '@/utils/common.utils';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useRouter } from 'next/navigation';
import { ILocationDetails } from '@/types/irl.types';
import useClickedOutside from '@/hooks/useClickedOutside';
import IrlLocationPopupView from './irl-location-popupView';
import IrlSeeMoreLocationCard from './irl-see-more-location-card';
import PlEventCard from './pl-button-card';

interface IrlLocation {
  locationDetails: ILocationDetails[];
  searchParams: any;
}

const IrlLocation = (props: IrlLocation) => {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState(props.locationDetails);
  const [showMore, setShowMore] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchParams = props?.searchParams;
  const analytics = useIrlAnalytics();
  const router = useRouter();
  const locationRef = useRef<HTMLDivElement>(null);
  const [cardLimit, setCardLimit] = useState(2);

  const onCloseModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  const onViewPlEventsClick = () => {
    analytics.trackViewPLEventsClick();
  };

  useEffect(() => {
    const updateCardLimit = () => {
      setCardLimit(window.innerWidth < 1440 ? 2 : 4);
    };

    updateCardLimit();
    window.addEventListener('resize', updateCardLimit);

    return () => window.removeEventListener('resize', updateCardLimit);
  }, []);

  useEffect(() => {
    const showCardLimit = window.innerWidth < 1440 ? 2 : 4;
    if (searchParams?.location) {
      const locationName = searchParams.location;
      const locationDataIndex = locations.findIndex((loc) => loc.location.split(',')[0].trim() === locationName);

      if (locationDataIndex >= 0) {
        if (locationDataIndex >= showCardLimit) {
          const updatedLocations = [...locations];
          [updatedLocations[locationDataIndex], updatedLocations[showCardLimit]] = [
            updatedLocations[showCardLimit],
            updatedLocations[locationDataIndex],
          ];
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
  };

  const setSearchParams = (locationDetail: any, currentParams: URLSearchParams, searchParams: any) => {
    // Only set the location parameter, remove all other parameters
    currentParams.set('location', locationDetail?.location?.split(',')[0].trim());

    // Remove type and event parameters to keep URL clean
    currentParams.delete('type');
    currentParams.delete('event');
  };

  const handleCardClick = (locationDetail: any) => {
    const currentParams = new URLSearchParams();

    setSearchParams(locationDetail, currentParams, searchParams);

    const locationChanged = locationDetail?.location?.split(',')[0].trim() !== searchParams?.location;
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

    const currentParams = new URLSearchParams();
    setSearchParams(clickedLocation, currentParams, searchParams);

    router.push(`${window.location.pathname}?${currentParams.toString()}`);

    dialogRef.current?.close();
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
          {locations
            ?.slice(0, 3)
            .map((location: any, index: any) => (
              <IrlLocationCard
                key={location.uid}
                {...location}
                isActive={activeLocationId ? activeLocationId === location.uid : index === 0}
                onCardClick={() => handleCardClick(location)}
              />
            ))}
        </div>

        <div className="root__card__desktop-sm">
          {locations
            ?.slice(0, 5)
            .map((location: any, index: any) => (
              <IrlLocationCard
                key={location.uid}
                {...location}
                isActive={activeLocationId ? activeLocationId === location.uid : index === 0}
                onCardClick={() => handleCardClick(location)}
              />
            ))}
        </div>

        <div className="root__irl__seeMoreCard__desktop--sm">
          {locations?.length > 3 && (
            <IrlSeeMoreLocationCard
              count={3}
              handleClick={handleClick}
              locations={locations.slice(1)}
              locationRef={locationRef}
            />
          )}
        </div>
        <div className="root__irl__seeMoreCard__desktop--lg">
          {locations?.length > cardLimit && (
            <IrlSeeMoreLocationCard
              count={cardLimit}
              handleClick={handleClick}
              locations={locations.slice(1)}
              locationRef={locationRef}
            />
          )}
        </div>

        <a
          href={process.env.NEXT_PUBLIC_PL_EVENTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onViewPlEventsClick}
          className="root__irl__event__card"
        >
          <PlEventCard />
        </a>

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

        {showMore && (
          <div className="root__irl__seeMoreCard__desktop--lg">
            <div className="root__irl__overlay">
              {locations
                ?.slice(cardLimit + 1)
                .map((location: ILocationDetails, index: React.Key | null | undefined) => (
                  <IrlLocationPopupView
                    key={location.location}
                    location={location}
                    handleResourceClick={handleResourceClick}
                  />
                ))}
            </div>
          </div>
        )}

        <div className="root__irl__mobileView">
          <Modal modalRef={dialogRef} onClose={onCloseModal}>
            <div className="root__irl__header"> Select a location</div>
            <div className="root__irl__mobileModal">
              {locations
                ?.slice(4)
                .map(
                  (
                    location: { flag: any; location: any; upcomingEvents: any; pastEvents: any },
                    index: React.Key | null | undefined,
                  ) => (
                    <div
                      key={index}
                      className="root__irl__mobileModal__cnt"
                      onClick={() => handleResourceClick(location)}
                    >
                      <div className="root__irl__mobileModal__cnt__location">
                        <div>
                          <img
                            src={location.flag ? location.flag : '/images/irl/defaultFlag.svg'}
                            alt="flag"
                            style={{ width: '20px', height: '20px' }}
                          />
                        </div>
                        <div>{location.location.split(',')[0].trim()}</div>
                      </div>
                      <div className="root__irl__mobileModal__cnt__events">
                        {location.upcomingEvents?.length > 0 && (
                          <>
                            <span>{location.upcomingEvents?.length ?? 0}</span> Upcoming
                          </>
                        )}
                        {location.pastEvents?.length > 0 && (
                          <>
                            <span>{location.pastEvents?.length ?? 0}</span> Past
                          </>
                        )}
                      </div>
                    </div>
                  ),
                )}
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
            justify-content: center;
            // padding: 8px 0px 8px 0px;
          }

          .root_irl__expanded__imgcntr__img {
            background-color: #ffffff;
            border-radius: 100%;
            width: 32px;
            height: 32px;
            padding: 4px 0px 0px;
            gap: 10px;
            border: 1px solid #cbd5e1;
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
            box-shadow: 0px 4px 4px 0px #0f172a0a;
          }

          .root__irl__overlay__cnt {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            padding: 5px;
            color: #0f172a;
            cursor: pointer;
          }

          .root__irl__overlay__cnt:hover {
            background-color: #f7fafc;
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
            color: #0f172a;
          }

          .root__irl__overlay__cnt__location__icon,
          .root__irl__overlay__cnt__location__title {
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
            color: #156ff7;
          }

          .root__irl__mobileModal__cnt__events span {
            color: #156ff7;
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
            border-bottom: 1px solid #cbd5e1;
            cursor: pointer;
          }

          .root__irl__mobileModal__cnt:hover {
            background-color: #f7fafc;
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

          .root__irl__event__card {
            display: flex;
          }

          @media (min-width: 360px) {
            .root {
              height: 100px;
            }
            .root__irl__expanded {
              width: 140px;
              height: 100px;
              gap: 5px;
              background: linear-gradient(152.61deg, #f5f8ff 24.8%, #bbdef7 108.1%);
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

            .root__irl__openModal,
            .root__irl__overlay {
              display: none;
            }

            .root__irl__mobileModal,
            .root__irl__mobileView {
              display: flex;
              width: 90vw;
              max-height: 70vh;
              overflow-y: auto;
            }

            .root__irl__seeMoreCard__desktop--lg,
            .root__card__desktop-sm {
              display: none;
            }
          }

          @media (min-width: 1024px) {
            .root {
              height: 170px;
            }
            .root__irl__seeMoreCard__desktop--sm {
              display: none;
            }
            .root__irl__seeMoreCard__desktop--lg {
              display: flex;
              // margin-left: 10px;
            }

            .root__irl__openModal,
            .root__irl__overlay {
              display: flex;
              flex-direction: column;
            }

            .root__irl__overlay {
              overflow-y: auto;
              margin-right: 180px;
            }
            .root__irl__expanded {
              width: 161px;
              height: 150px;
              background: linear-gradient(152.61deg, #f5f8ff 24.8%, #bbdef7 108.1%), url('/images/irl/Clouds v2.svg');
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
              padding: 5px 0px 5px 0px;
            }

            .root__irl__expanded__showMore {
              width: 161px;
              margin-top: 10px;
              padding-bottom: 6px;
            }

            .root__irl__mobileModal,
            .root__irl__mobileView {
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
              margin-right: 175px;
            }
          }

          @media (min-width: 1920px) {
            .root__irl__expanded {
              align-items: center;
              width: 225px;
              background:
                linear-gradient(152.61deg, #f5f8ff 24.8%, #bbdef7 108.1%),
                url('/images/irl/2560 animation asset v3.2.svg');
            }
            .root__irl__overlay {
              width: 232px;
              right: 9px;
              margin-right: 239px;
            }
          }

          @media (min-width: 2560px) {
            .root__irl__expanded {
              width: 305px;
              height: 150px;
            }
            .root__irl__overlay {
              width: 306px;
              margin-right: 320px;
            }
          }
        `}
      </style>
    </>
  );
};

export default IrlLocation;
