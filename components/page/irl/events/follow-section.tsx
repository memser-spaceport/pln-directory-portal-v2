import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useState, useEffect } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { IRL_SUBMIT_FORM_LINK, FOLLOW_ENTITY_TYPES } from '@/utils/constants';
import { toast } from 'react-toastify';
import { getFollowersByLocation } from '@/services/irl.service';
import { get } from 'http';
import { useRouter } from 'next/navigation';

const FollowSection = (props: any) => {
  const userInfo = props?.userInfo;
  const eventLocationSummary = props?.eventLocationSummary;
  const searchParams = props?.searchParams;
  const analytics = useIrlAnalytics();
  const router = useRouter();
  const [followProperties, setFollowProperties] = useState<any>({followers: [], isFollowing: false});

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
    analytics.irlLocationUnFollowBtnClicked({ userInfo, locationId: locationId });
  };

  return (
    <>
      <div className="root__irl__follwcnt">
        <div className="root__irl__follwcnt__imgsec">
          <div className="root__irl__follwcnt__imgsec__images">
            {followProperties.followers?.slice(0, 3).map((follower: any, index: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                style={{ position: 'relative', zIndex: `${followProperties.followers.length - index}`, marginLeft: `-11px` }}
                className="root__irl__follwcnt__imgsec__images__img"
                src={follower.member.image.url}
                alt="follower"
                height={24}
                width={24}
              />
            ))}
          </div>
          <div className="root__irl__follwcnt__imgsec__desccnt">
            <p className="root__irl__follwcnt__imgsec__desccnt__desc">
              {followProperties.isFollowing ? `You ${followProperties.followers.length > 1 ? `${followProperties.followers.length - 1}` : ''}` : `${followProperties.followers.length}`} Following
            </p>
          </div>
        </div>

        {followProperties.isFollowing && (
          <button className="root__irl__follwcnt__followingbtn" onClick={() => onUnFollowbtnClicked(eventLocationSummary.uid)}>
            <img src="/icons/bell-black.svg" alt="follow" />
            Following
          </button>
        )}

        {!followProperties.isFollowing && (
          <button className="root__irl__follwcnt__followbtn" onClick={() => onFollowbtnClicked(eventLocationSummary.uid)}>
            <img src="/icons/bell-white.svg" alt="follow" />
            Follow
          </button>
        )}
      </div>

      <style jsx>
        {`
          .root__irl__follwcnt {
            width: 100%;
            justify-content: space-between;
          }

          .root__irl__follwcnt__imgsec {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .root__irl__follwcnt__imgsec__images {
            display: flex;
            justify-content: end;
          }

          .root__irl__follwcnt__imgsec__images__img {
            height: 24px;
            width: 24px;
            border: 1px solid #156ff7;
            object-fit: cover;
            border-radius: 50%;
          }

          .root__irl__follwcnt {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .root__irl__follwcnt__followbtn {
            padding: 4px 8px;
            border: 1px solid #cbd5e1;
            background: #156ff7;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            color: #fff;
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
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          @media (min-width: 700px) {
            .root__irl__follwcnt {
              width: unset;
              justify-content: unset;
            }

            .root__irl__follwcnt__imgsec {
              display: unset;
            }

            .root__irl__follwcnt__followbtn {
              padding: 10px 16px;
            }

            .root__irl__follwcnt__followingbtn {
              padding: 10px 16px;
            }
          }
        `}
      </style>
    </>
  );
};

export default FollowSection;
