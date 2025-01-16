import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useState, useEffect, useRef } from 'react';
import { EVENTS } from '@/utils/constants';
import AllFollowers from './all-followers';
import Image from 'next/image';

const FollowSection = (props: any) => {
  const userInfo = props?.userInfo;
  const eventLocationSummary = props?.eventLocationSummary;
  const searchParams = props?.searchParams;
  const analytics = useIrlAnalytics();
  const [followProperties, setFollowProperties] = useState<any>({ followers: [], isFollowing: false });

  function getFollowProperties(followers: any) {
    return {
      followers: followers ?? [],
      isFollowing: followers.some((follower: any) => follower.memberUid === userInfo?.uid),
    };
  }

  useEffect(() => {
    setFollowProperties((e: any) => getFollowProperties(props.followers));
  }, [eventLocationSummary.uid, searchParams]);

  useEffect(() => {
    function updateFollowers(e: any) {
      setFollowProperties(getFollowProperties(e.detail));
    }
    document.addEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    return function () {
      document.removeEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    };
  }, []);

  const onFollowersCloseClicHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: false } }));
  };

  const onFollowerClickHandler = () => {
    analytics.irlFollowerBtnClicked({});
  };

  const onFollowersClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: true } }));
    const filteredFollowers = followProperties.followers?.map((follower: any) => follower.memberUid);
    analytics.irlAllFollowersBtnClicked({ followers: filteredFollowers });
  };

  return (
    <>
      <AllFollowers location={eventLocationSummary.name} onClose={onFollowersCloseClicHandler} followersList={followProperties.followers} onFollowerClickHandler={onFollowerClickHandler} />
      <div className="root__irl__follwcnt">
        <div className='root__irl__follcnt__update'>Follow to get real-time updates and never miss upcoming events.</div>

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
          </div>
          <div className="root__irl__follwcnt__imgsec__desccnt">
          <span className='root__irl__follwcnt__imgsec__desccnt__desc__cnt' onClick={onFollowersClickHandler}>{followProperties.followers.length} {followProperties.followers.length > 1 ? "members" : "member"} </span>
              following gatherings at
              <span className='root__irl__follwcnt__imgsec__desccnt__desc__cnt__location'><img src={eventLocationSummary.flag} alt="flag" style={{ width: '17px', height: '17px' }} /> {eventLocationSummary.name} </span>
          </div>
        </div>
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
            // width: 100%;
          }

          .root__irl__follwcnt__imgsec__images {
            display: flex;
            justify-content: end;
            cursor: pointer;
            min-height: ${followProperties?.followers?.length > 0 ? '25px' : ''}
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
            flex-wrap: wrap;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt{
            color: #156ff7;
            cursor: pointer;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt__location {
            display: flex;
            align-items: center;
            gap: 4px;
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

        .root__irl__follcnt__update {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0.01em;
          text-align: left;
        }
          
          @media (min-width: 360px) {
              
            .root__irl__follcnt__update {
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
          .root__irl__follwcnt__imgsec__desccnt {
            display: flex;
            gap: 4px;
          }

            .root__irl__follcnt__update {
              display: flex;
            }
            .popup__cnt {
              height: 220px;
              width: 656px;
              padding: 24px;
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
