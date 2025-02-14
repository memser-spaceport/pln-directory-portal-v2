'use client';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { useEffect, useRef, useState } from 'react';
import { EVENTS, FOLLOW_ENTITY_TYPES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { triggerLoader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Modal from '@/components/core/modal';
import Image from 'next/image';

const LocationCard = (props: any) => {
  const location = props?.location;
  const logo = props?.icon || '/icons/team-default-profile.svg';
  const flag = props?.flag;
  const userInfo = props?.userInfo;
  const uid = props.uid;
  const getFeaturedData = props.getFeaturedDataa;
  const [followProperties, setFollowProperties] = useState<any>({ followers: [], isFollowing: false });
  let eventLocationSummary = { uid, name: location, flag }

  function getFollowProperties(followers: any) {
    return {
      followers: followers ?? [],
      isFollowing: followers?.some((follower: any) => follower.memberUid === userInfo?.uid),
    };
  }

  useEffect(() => {
    setFollowProperties((e: any) => getFollowProperties(props.followers));
  }, [eventLocationSummary.uid, props.followers]);

  useEffect(() => {
    function updateFollowers(e: any) {
      setFollowProperties(getFollowProperties(e.detail));
    }
    document.addEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    return function () {
      document.removeEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    };
  }, []);

  const upcomingEvents = props?.upcomingEvents;

  const visibleEvents = upcomingEvents?.slice(0, 4);
  const hiddenEventCount = upcomingEvents?.length - visibleEvents?.length;
  const remainingEvents = upcomingEvents?.slice(4);

  const attendee = upcomingEvents?.flatMap((item: any) => item?.eventGuests);
  const uniqueMembers: any[] = [];
  const seenUids = new Set();
  
  attendee?.forEach((item: any) => {
    const uid = item.member?.uid?.trim();  
    if (uid && !seenUids.has(uid)) {
      seenUids.add(uid);
      uniqueMembers.push(item);
    }
  });

  const router = useRouter();
  const analytics = useIrlAnalytics();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onCloseModal = (e: any) => {
    if (dialogRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dialogRef.current.close();
    }
  };

  const handleClickUnFollowPopUp = (e: any) => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  };

  const onFollowbtnClicked = async (locationId: string) => {
    if (userInfo) {
      try {
        triggerLoader(true);
        const { authToken } = getCookiesFromClient();
        const response = await customFetch(
          `${process.env.DIRECTORY_API_URL}/v1/member-subscriptions`,
          {
            cache: 'no-store',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              memberUid: userInfo?.uid,
              entityType: FOLLOW_ENTITY_TYPES.LOCATION,
              entityUid: uid,
              entityAction: 'Default',
              isActive: true,
            }),
          },
          true
        );

        if (response?.ok) {
          await getFeaturedData();
          toast.success(`Successfully following ${eventLocationSummary.name}`);
          analytics.irlLocationFollowBtnClicked({ userInfo, locationId: locationId });
        }
        triggerLoader(false);
        router.refresh();
      } catch (e) {
        triggerLoader(false);
      }
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };

  const onUnFollowbtnClicked = async (locationId: string) => {
    try {
      triggerLoader(true);
      const { authToken } = getCookiesFromClient();
      const memberFollowUp = followProperties?.followers.find((follower: any) => follower.memberUid === userInfo?.uid);

      const response = await customFetch(
        `${process.env.DIRECTORY_API_URL}/v1/member-subscriptions/${memberFollowUp.uid}`,
        {
          cache: 'no-store',
          method: 'PUT',
          body: JSON.stringify({
            isActive: false,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        },
        true
      );
      if (response?.ok) {
        await getFeaturedData();
        toast.success(`Successfully unfollowed ${eventLocationSummary.name}`);
        analytics.irlLocationUnFollowBtnClicked({ userInfo, locationId: locationId });
      }
      triggerLoader(false);
      router.refresh();
    } catch (e) {
      triggerLoader(false);
    }
  };

  return (
    <>
      <div className="LocationCard">
        <div className="LocationCard__header">
          <div className="LocationCard__header__img">

            <img className='' src={logo} width={60} height={60} alt="team image" />
          </div>
        </div>
        <div className="LocationCard__content">
          <div className='LocationCard__content__top'>

            <div className="LocationCard__content__heading">Discover gatherings happening in</div>
            <div className="LocationCard__content__ttl">
              <div><img src={flag} alt="flag" style={{ width: '20px', height: '20px' }} /></div>
              <div className='LocationCard__content__name'>{location}</div>
            </div>

          </div>
          <div className="LocationCard__content__eventCntr">
            <div className="LocationCard__content__eventCntr__br"></div>
            <div className="LocationCard__content__eventCntr__cnt">
              {upcomingEvents?.length > 0 ? upcomingEvents?.length : 'No'} Upcoming Events
            </div>
            <div className="LocationCard__content__eventCntr__br"></div>
          </div>
          {upcomingEvents?.length > 0 ?
            <div className="LocationCard__content__eventCntr__events ">
              <div className='Location__content__eventCntr__events__cntr'>
                {visibleEvents.map((event: any, index: number) => (
                  <Tooltip
                    key={index}
                    asChild
                    align="start"
                    trigger={<div className="eventsList">{event.name}</div>}
                    content={<div className="eventName">{event.name}</div>}
                  />
                ))}
                {hiddenEventCount > 0 && (
                  <Tooltip
                    asChild
                    align="start"
                    content={
                      <div className="allEvents">
                        {remainingEvents.map((event: any, index: number) => (
                          <div className="eventName" key={index}>
                            {event.name}{ }
                            {index < remainingEvents?.length - 1 ? ',' : ''}
                          </div>
                        ))}
                      </div>
                    }
                    trigger={<button className="hiddenCount">+{hiddenEventCount} more</button>}
                  />
                )}
              </div>
            </div>
            :
            <div className='LocationCard__content__eventCntr__no-events'>
              Stay tuned for upcoming gatherings in {props?.location?.split(",")[0].trim()}! Follow this location for updates
            </div>
          }
        </div>
        <div className="LocationCard-footer-line"></div>
        <div className='LocationCard-follCntr' onClick={(e: any) => {
          e.stopPropagation();
          e.preventDefault();
        }}>
          <div className="followRoot">
            {followProperties?.isFollowing ? (
              <>
                <Tooltip
                  asChild
                  align="center"
                  trigger={
                    <button className="followRoot__followingBtn__cntr" 
                    onClick={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleClickUnFollowPopUp(eventLocationSummary.uid)}}
                    >
                      <span className="followRoot__followingBtn">
                        <div className="root__irl__follwcnt__imgsec__images">
                          {[
                            ...props.followers
                              ?.map((item: { member: any }) => item.member?.image?.url)
                              .filter((url: string | undefined) => !!url),
                            ...Array(props?.followers?.length).fill('/icons/default_profile.svg')
                          ]
                            .slice(0, Math.min(3, props?.followers?.length))
                            .map((url: string, index: number) => (
                              <Image
                                key={index}
                                style={{ position: 'relative', zIndex: `${index + 1}`, marginLeft: `-8px` }}
                                className="root__follwcnt__imgsec__images__img"
                                src={url}
                                alt="follower"
                                height={16.45}
                                width={16.45}
                              />
                            ))}
                        </div>
                        <span>{props?.followers?.length} Following</span>
                      </span>
                      <span className="followRoot__followingBtn--line"></span>
                      <span className='followRoot__followingBtn__icon'>
                        <img src="/icons/bell-green.svg" alt="follow" />
                      </span>
                    </button>
                  }
                  content={
                    <div className="eventName">Unfollow Gathering</div>
                  }
                />

                <>
                  {attendee?.length > 0 &&
                    <div className="followRoot__followingBtn__count">
                      <img src="/icons/thumbs-up.svg" alt="Thumbs Up" />
                      <span>{`${uniqueMembers.length} Attending`}</span>
                    </div>}
                </>
              </>
            ) : (
              <>
                {
                  props?.followers?.length > 0 || attendee?.length > 0 ?
                    <>
                      <Tooltip
                        asChild
                        align="center"
                        trigger={
                          <button className="followRoot__followBtn" 
                          onClick={(e: any) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onFollowbtnClicked(eventLocationSummary.uid)}}
                          >
                            {props?.followers?.length > 0 ?
                              <>
                                <span className='followRoot__followBtn_cntr'>
                                  <div className="root__irl__follwcnt__imgsec__images">
                                    {[
                                      ...props.followers
                                        ?.map((item: { member: any }) => item.member?.image?.url)
                                        .filter((url: string | undefined) => !!url),
                                      ...Array(props?.followers?.length).fill('/icons/default_profile.svg')
                                    ]
                                      .slice(0, Math.min(3, props?.followers?.length))
                                      .map((url: string, index: number) => (
                                        <Image
                                          key={index}
                                          style={{ position: 'relative', zIndex: `${index + 1}`, marginLeft: `-8px` }}
                                          className="root__follwcnt__imgsec__images__img"
                                          src={url}
                                          alt="follower"
                                          height={16.45}
                                          width={16.45}
                                        />
                                      ))}
                                  </div>
                                  <span className=''>
                                    {props?.followers?.length} Following
                                  </span>
                                </span>
                                <span className="followRoot__followingBtn--line"></span>
                                <span className='followBtn__follow__icon'>
                                  <img src="/icons/bell-blue.svg" alt="follow" />
                                </span>
                              </>
                              :
                              <div className='followRoot__followBtn__no-followers'>
                                <img src="/icons/bell-white.svg" alt="follow" />
                                Follow for update
                              </div>
                            }
                          </button>
                        }
                        content={<div className="eventName">Click to follow gathering</div>}
                      />

                      {attendee?.length > 0 &&
                        <div className="followRoot__followingBtn__count">
                          <img src="/icons/thumbs-up.svg" alt="Thumbs Up" />
                          <span>{`${uniqueMembers?.length} Attending`}</span>
                        </div>
                      }
                    </>
                    :
                    <Tooltip
                      asChild
                      align="center"
                      trigger={
                        <>
                          <div className='LocationCard-follCntr__cnt'>
                            Receive event updates & notifications
                          </div>
                          <button 
                            className="followRoot__followBtn__no-followers" 
                            onClick={(e: any) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onFollowbtnClicked(eventLocationSummary.uid)}}
                            >
                            <img src="/icons/bell-white.svg" alt="follow" />
                            Follow
                          </button>
                        </>
                      }
                      content={<div className="eventName">Click to follow gathering</div>}
                    />
                }
              </>
            )}
          </div>
        </div >
      </div >

      <Modal modalRef={dialogRef} onClose={onCloseModal}>
        <div className="popup__cnt" onClick={(e: any) => {e.preventDefault();}}>
          <div className="popup__cnt__header"> Wait! You&apos;re about to miss out…</div>
          <div className="popup__cnt__body">You&apos;ll stop receiving updates about exciting events happening in {eventLocationSummary.name}. Stay connected to never miss out!</div>

          <div className="popup__footer">
            <button onClick={onCloseModal} className="popup__footer__cancel">
              Cancel
            </button>
            <button
              onClick={(e: any) => {
                onCloseModal(e);
                onUnFollowbtnClicked(eventLocationSummary.uid);
              }}
              className={`popup__footer__confirm `}
            >
              Unfollow
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .LocationCard {
          width: 100%;
          height: 290px;
          border-radius: 12px;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          background-color: white;
          display: flex;
          flex-direction: column;
          gap: ${followProperties.isFollowing ? '5px' : '5px'};
        }

        .LocationCard:hover {
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .LocationCard__content__top {
          display: flex;
          flex-direction: column;
        }

        .followRoot__followingBtn--line {
          width: 1px;
          height: 100%;
          background: #cbd5e1;
        }

        .LocationCard-follow__cntr {
          display: flex;
          flex-direcion: row;
          justify-content: space-between;
        }

        .LocationCard:active {
          border-radius: 12px;
          outline-style: solid;
          outline-width: 1px;
          outline-offset: 0;
          outline-color: #156ff7;
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .LocationCard-follCntr__cntr {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .followBtn__follow__icon {
          display: flex;
          padding: 5px;
          border-left: none;
        }

        .LocationCard__content__heading {
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          text-align: center;
        }
        .LocationCard__header {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 205.47%);
          min-height: 64px;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
          border-radius: 12px 12px 0px 0px;
          display: flex;
          justify-content: end;
        }

        .LocationCard__header__img {
          border-radius: 4px;
          position: absolute;
          transform: translateX(50%);
          right: 50%;
          top: 20px;
          height: 74px;
          width: 74px;
          background: #f1f5f9;
          display: flex;
          background: linear-gradient(180deg, #EDF8FF 0%, #E0FFE3 100%);
        }

        .LocationCard__header__img::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 8px; 
          border: 2px solid transparent;
          background: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%) border-box;
          -webkit-mask:
            linear-gradient(#fff 0 0) padding-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
        }

        .LocationCard__header__img img {
          position: relative;
          left: 7px;
          top: 7px;
        }

        .LocationCard__content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          aign-items: center;
          padding: 7px;
          margin-top: 30px;
        }

        .LocationCard__content__ttl {
          display: flex;
          flex-direction: row;
          gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .LocationCard__content__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          text-align: center;
          color: #475569;
          padding: 0px 17px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
        }

        .LocationCard__header__badge {
          color: #fff;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 500;
          line-height: 28px;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          width: 42px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0px 12px 0px 12px;
        }

        .followRoot__followBtn_cntr {
          display: flex;
          gap: 5px;
          padding: 0px 5px;
          align-items: center;
          border-radius: 8px 0px 0px 8px;
          width: 200px;
          align-items: center;
          padding: 4px 4px 4px 17px;
          width: ${attendee?.length > 0 ? '125px' : '235px'};
          justify-content: center; 
          cursor: pointer;
        }

        .LocationCard-footer {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(174, 217, 254, 0.5) 100%);
          min-height: 70px;
          border-radius: 0px 0px 12px 12px;
        }

        .LocationCard__content__eventCntr {
          display: flex;
          flex-direction: row;
          gap: 10px;
          justify-content: center;
        }

        .LocationCard__content__eventCntr__br {
          border: 1px solid #156FF7;
          width: 50px;
          height: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          top: 50%;
          position: relative;
        }

        .LocationCard__content__eventCntr__cnt {
          font-size: 12px;
          font-weight: 600;
          line-height: 14px;
          text-align: left;
          color: #156FF7;
        }

        .LocationCard__content__eventCntr__events {
          display: flex;
          flex-direction: row;
          gap: 10px;
          justify-content: center;
          align-items: center;
          
        }

        .eventsContainer {
          display: flex;
          align-items: center;
          overflow: hidden;
          height: inherit;
        }

        .eventName {
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
        }

        .eventsList {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 90px;
          padding: 0px 6px;
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          border-radius: 5px;
          height: 23px;;
          border: 0.5px solid #DBEAFE;
          background-color: #ffffff;
        }

        .allEvents {
          display: flex;
          flex-direction: column;
        }

        .hiddenCount {
          font-weight: bold;
          border: 0.5px solid #DBEAFE;
          height: inherit;
          display: inline-flex;
          align-items: center;
          padding: 0px 6px;
          color: #0f172a;
          font-size: 11.5px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          background-color: transparent;
          border-radius: 5px;
        }

        .Location__content__eventCntr__events__cntr {
          width: 260px;
          height: 50px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: center;
        }

        .LocationCard-footer-line {
          width: 268px;
          height: 1px;
          background: #E2E8F0;
          left: 10px;
          position: relative;
        }

        .LocationCard-follCntr {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 5px 13px;
          cursor: default;
        }

        .LocationCard-follCntr__cnt {
          font-size: 11.5px;
          font-weight: 500;
          line-height: 15px;
          text-align: left;
          color: #64748B;
        }

        .LocationCard__content__eventCntr__no-events {
          font-size: 12px;
          font-weight: 400;
          line-height: 18px;
          text-align: center;
          padding: 4px 10px;
        }

        .followRoot__followBtn {
          padding: ${props?.followers?.length > 0 ? '0px' : ''};
          min-width: 82px;
          border-radius: 8px;
          display: flex;
          gap: ${props?.followers?.length > 0 ? '0px' : '8px'};
          align-items: center;
          color: ${props?.followers?.length > 0 ? '#0F172A' : '#fff'};
          font-weight: 500;
          line-height: 20px;
          font-size: 11.5px;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          background: ${props?.followers?.length > 0 ? '#fff' : 'none'};
          border: 1px solid #cbd5e1 !important;
          cursor: pointer;
        }

        .followRoot__followBtn:hover {
           border:  ${followProperties.isFollowing ? '' : '1px solid #156ff7 !important'} ;
           cursor: pointer;
        }

        .followRoot__followBtn__no-followers {
          padding: 4px 7px;
          min-width: 82px;
          border-radius: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
          color: #fff;
          font-weight: 500;
          line-height: 20px;
          font-size: 14px;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          background: #156FF7;
        }

        .followRoot__followingBtn__cntr {
          display: flex;
          background: inherit;
          border: 1px solid #cbd5e1; 
          border-radius: 8px;
        }

        .followRoot__followingBtn__cntr:hover {
          border: 1px solid #156ff7; 
          cursor: pointer;
        }

        .followRoot__followingBtn__count {
          font-size: 11.5px;
          font-weight: 500;
          line-height: 12px;
          text-align: left;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: default;
        }

        .followRoot__followingBtn__icon {
          padding: 5px; 
          background: #ffffff;
          border-radius: 0px  8px  8px  0px;
          display: flex;
          gap: 8px;
          align-items: center;
          font-weight: 500;
          line-height: 20px;
          width: 30px;
          font-size: 14px;
          box-shadow: 0px 1px 1px 0px #0f172a14;
        }
        .followRoot__followingBtn {
          padding: 5px; 
          background: #ffffff;
          border-radius: 8px  0px  0px  8px;
          display: flex;
          gap: 8px;
          align-items: center;
          font-weight: 500;
          line-height: 20px;
          width: ${attendee?.length > 0 ? '125px' : '235px'};
          font-size: 11.5px;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          justify-content: center;
        }

        .followRoot {
          display: flex;
          flex-direction: row;
          align-items:  center;
          justify-content: space-between;
          width: 100%;
        }
        .popup__footer {
          display: flex;
          justify-content: end;
          gap: 10px;
          margin-top: 16px;
          padding: 10px 10px 0px 0px;
        }

        .popup__footer__cancel {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #0f172a;
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 10px 24px;
          border-radius: 8px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup__footer__confirm {
          height: 40px;
          border-radius: 8px;
          padding: 10px 24px;
          background: #dd2c5a;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #ffffff;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup__cnt__header {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          text-align: left;
          color: #0f172a;
          padding-top: 10px;
        }

        .popup__cnt__body {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          padding-top: 20px;
        }

        .LocationCard__content__name {
          font-family: Inter;
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          text-align: center;
        }

        .root__irl__follwcnt__imgsec__images {
          display: flex;
          justify-content: end;
          cursor: pointer;
        }

        @media (min-width: 360px) {
          .followRoot__unfollow__popup {
            display: flex;
            width: 90vw;
            max-height: 70vh;
            overflow-y: auto;
          }

          .popup__cnt {
            width: 89vw;
            max-height: 80svh;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding: 20px;
          }
        }

        @media (min-width: 1024px) {
          .popup__cnt {
            height: 220px;
            width: 656px;
            padding: 24px;
          }

          .followRoot__unfollow__popup {
            display: flex;
            width: 90vw;
            max-height: 70vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </>
  );
};

export default LocationCard;
