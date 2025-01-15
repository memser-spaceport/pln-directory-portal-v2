import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useState, useEffect, useRef } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { IRL_SUBMIT_FORM_LINK, FOLLOW_ENTITY_TYPES, EVENTS } from '@/utils/constants';
import { toast } from 'react-toastify';
import { getFollowersByLocation } from '@/services/irl.service';
import { get } from 'http';
import { useRouter } from 'next/navigation';
import AllFollowers from './all-followers';
import Image from 'next/image';
import Modal from "@/components/core/modal";


const FollowSection = (props: any) => {
  const userInfo = props?.userInfo;
  const eventLocationSummary = props?.eventLocationSummary;
  const searchParams = props?.searchParams;
  const analytics = useIrlAnalytics();
  const router = useRouter();
  const [followProperties, setFollowProperties] = useState<any>({ followers: [], isFollowing: false });
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onCloseModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  const handleClickUnFollowPopUp = (e: React.MouseEvent) => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }

  function getFollowProperties(followers: any) {
    return {
      followers: followers ?? [],
      isFollowing: followers.some((follower: any) => follower.memberUid === userInfo?.uid),
    };
  }

  useEffect(() => {
    setFollowProperties((e: any) => getFollowProperties(props.followers));
  }, [eventLocationSummary.uid, searchParams]);

  const onFollowbtnClicked = async (locationId: string) => {
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
            entityUid: locationId,
            entityAction: 'Default',
            isActive: true,
          }),
        },
        true
      );

      if (response?.ok) {
        toast.success(`Successfully following ${eventLocationSummary.name}`);
        analytics.irlLocationFollowBtnClicked({ userInfo, locationId: locationId });
        const followersResponse = await getFollowersByLocation(locationId, authToken ?? '');
        if (!followersResponse?.isError) {
          setFollowProperties(getFollowProperties(followersResponse.data));

        }
      }
      triggerLoader(false);
      router.refresh();
    } catch (e) {
      triggerLoader(false);
    }
  };

  const onUnFollowbtnClicked = async (locationId: string) => {
    try {
      triggerLoader(true);
      const { authToken } = getCookiesFromClient();
      const memberFollowUp = followProperties.followers.find((follower: any) => follower.memberUid === userInfo?.uid);

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
        toast.success(`Successfully unfollowed ${eventLocationSummary.name}`);
        analytics.irlLocationUnFollowBtnClicked({ userInfo, locationId: locationId });
        const followersResponse = await getFollowersByLocation(locationId, authToken ?? '');
        if (!followersResponse?.isError) {
          setFollowProperties(getFollowProperties(followersResponse.data));
        }
      }
      triggerLoader(false);
      router.refresh();
    } catch (e) {
      triggerLoader(false);
    }
  };

  const onFollowersCloseClicHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: false } }))
  }

  const onFollowerClickHandler = () => {
    analytics.irlFollowerBtnClicked({})


  }

  const onFollowersClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: true } }))
    const filteredFollowers = followProperties.followers?.map((follower: any) => follower.memberUid)
    analytics.irlAllFollowersBtnClicked({ followers: filteredFollowers });

  }

  return (
    <>
      <AllFollowers location={eventLocationSummary.name} onClose={onFollowersCloseClicHandler} followersList={followProperties.followers} onFollowerClickHandler={onFollowerClickHandler} />
      <div className="root__irl__follwcnt">
        <div className="root__irl__follwcnt__imgsec">
          <div onClick={onFollowersClickHandler} className="root__irl__follwcnt__imgsec__images">
            {followProperties.followers?.slice(0, 3).map((follower: any, index: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <Image
                key={index}
                style={{ position: 'relative', zIndex: `${3 - index}`, marginLeft: `-11px` }}
                className="root__irl__follwcnt__imgsec__images__img"
                src={follower?.logo || '/icons/default_profile.svg'}
                alt="follower"
                height={24}
                width={24}
              />
            ))}
          </div >
          <div className="root__irl__follwcnt__imgsec__desccnt">
            <div className="root__irl__follwcnt__imgsec__desccnt__desc">
              <span className='root__irl__follwcnt__imgsec__desccnt__desc__cnt' onClick={onFollowersClickHandler}>{followProperties.isFollowing ? `You ${followProperties.followers.length > 1 ? `& ${followProperties.followers.length - 1}` : ''}` : `${followProperties.followers.length}`} members </span>
              are following this gathering at
              <span className='root__irl__follwcnt__imgsec__desccnt__desc__cnt__location'><img src={eventLocationSummary.flag} alt="flag" style={{ width: '17px', height: '17px' }} /></span>
              {eventLocationSummary.name}
            </div>
          </div>
          <div className="root__irl__follwcnt__imgsec__desccnt__mob">
            <div className="root__irl__follwcnt__imgsec__desccnt__desc">
              <span className='root__irl__follwcnt__imgsec__desccnt__desc__cnt' onClick={onFollowersClickHandler}>{followProperties.isFollowing ? `You ${followProperties.followers.length > 1 ? `& ${followProperties.followers.length - 1}` : ''}` : `${followProperties.followers.length}`} members</span>
            </div>
          </div>
        </div>

        {followProperties.isFollowing && (
          <button className="root__irl__follwcnt__followingbtn" onClick={() => handleClickUnFollowPopUp(eventLocationSummary.uid)}>
            <img src="/icons/bell-green.svg" alt="follow" />
            Following
          </button>
        )}

        {!followProperties.isFollowing && (
          <button className="root__irl__follwcnt__followbtn" onClick={() => onFollowbtnClicked(eventLocationSummary.uid)}>
            <img src="/icons/bell-blue.svg" alt="follow" />
            Follow this gathering
          </button>
        )}
      </div>

      <div className="root__irl__mobileView">
        <Modal modalRef={dialogRef} onClose={onCloseModal}>
          <div className='popup__cnt'>

            <div className="popup__cnt__header"> Wait! You&apos;re about to miss out…</div>
            <div className="popup__cnt__body">
              You&apos;ll stop receiving updates about exciting events happening in Kyoto. Stay connected to never miss out!
            </div>

            <div className="popup__footer">
              <button onClick={onCloseModal} className="popup__footer__cancel">
                cancel
              </button>
              <button
                onClick={() => {
                  onCloseModal();
                  onUnFollowbtnClicked(eventLocationSummary.uid)}
                }
                className={`popup__footer__confirm `}
              >
                Unfollow
              </button>
            </div>
          </div>
        </Modal>
      </div>

      <style jsx>
        {`
          .root__irl__follwcnt {
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 10px;
          }

          .root__irl__follwcnt__imgsec {
            display: flex;
            gap: 8px;
            align-items: center;
            padding-left: 12px;
          }

          .root__irl__follwcnt__imgsec__images {
            display: flex;
            justify-content: end;
            cursor: pointer;
            min-height: ${followProperties?.followers?.length > 0 ? "25px" : ""}
        }

          .root__irl__follwcnt {
            display: flex;
            gap: 12px;
            align-items: center;root__irl__follwcnt
          }

          .root__irl__follwcnt__followbtn {
            padding: 4px 8px;
            min-width: 103px;
            border: 1px solid #cbd5e1;
            background: #fff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            color: #0F172A;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }

          .root__irl__follwcnt__followingbtn {
            padding: 4px 8px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            gap:4px;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt{
            color: #156ff7;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt__location {
            display: flex;
            align-items: center;
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
          color: #0F172a;
          padding-top: 20px;
        }

          @media (min-width: 360px) {
            .root__irl__follwcnt__imgsec__desccnt {
              display: none;
            }

            .root__irl__mobileView {
              display: flex;
              width: 90vw;
              max-height: 70vh;
              overflow-y: auto;
            }


            .popup__cnt {
              width: 89vw;
              max-height: 80svh;
              min-height: 25vh;
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

            .root__irl__follwcnt__imgsec__desccnt {
              display: flex;
            }

            .root__irl__follwcnt__imgsec__desccnt__mob {
              display: none;
            }
            .root__irl__follwcnt {
              width: unset;
              justify-content: space-between;
            }

            .root__irl__follwcnt__imgsec {
              display: flex;
            }

            .root__irl__follwcnt__followbtn {
              padding: 10px 16px;
            }

            .root__irl__follwcnt__followingbtn {
              padding: 10px 16px;
            }

            .root__irl__mobileView {
              display: flex;
              width: 90vw;
              max-height: 70vh;
              overflow-y: auto;
            }
          }
        `}
      </style>
    </>
  );
};

export default FollowSection;
