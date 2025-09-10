import { getFollowersByLocation } from '@/services/irl.service';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { triggerLoader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from '@/components/core/ToastContainer';
import Modal from '@/components/core/modal';
import { EVENTS, FOLLOW_ENTITY_TYPES } from '@/utils/constants';

interface FollowButtonProps {
  eventLocationSummary: any;
  followProperties: any;
  userInfo: any;
  expand?: boolean;
}

const FollowButton = ({ eventLocationSummary, followProperties, userInfo, expand }: FollowButtonProps) => {
  const router = useRouter();
  const analytics = useIrlAnalytics();
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
            document.dispatchEvent(
              new CustomEvent(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, {
                detail: followersResponse.data,
              })
            );
          }
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
        toast.success(`Successfully unfollowed ${eventLocationSummary.name}`);
        analytics.irlLocationUnFollowBtnClicked({ userInfo, locationId: locationId });
        const followersResponse = await getFollowersByLocation(locationId, authToken ?? '');
        if (!followersResponse?.isError) {
          document.dispatchEvent(
            new CustomEvent(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, {
              detail: followersResponse.data,
            })
          );
        }
      }
      triggerLoader(false);
      router.refresh();
    } catch (e) {
      triggerLoader(false);
    }
  };

  return (
    <>
      <div className="followRoot">
        {followProperties?.isFollowing ? (
          <button className="followRoot__followingBtn" onClick={() => handleClickUnFollowPopUp(eventLocationSummary.uid)}>
            <img src="/icons/bell-green.svg" alt="follow" />
            Following
          </button>
        ) : (
          <button className="followRoot__followBtn" onClick={() => onFollowbtnClicked(eventLocationSummary.uid)}>
            <img src="/icons/bell-blue.svg" alt="follow" />
            Follow
          </button>
        )}
      </div>
      <Modal modalRef={dialogRef} onClose={onCloseModal}>
        <div className="popup__cnt">
          <div className="popup__cnt__header"> Wait! You&apos;re about to miss out…</div>
          <div className="popup__cnt__body">You&apos;ll stop receiving updates about exciting events happening in {eventLocationSummary.name}. Stay connected to never miss out!</div>

          <div className="popup__footer">
            <button onClick={onCloseModal} className="popup__footer__cancel">
              Cancel
            </button>
            <button
              onClick={() => {
                onCloseModal();
                onUnFollowbtnClicked(eventLocationSummary.uid);
              }}
              className={`popup__footer__confirm `}
            >
              Unfollow
            </button>
          </div>
        </div>
      </Modal>
      <style jsx>
        {`
          .followRoot__followBtn {
            padding: ${expand ? "9px 15.5px" : "9px 40px"};
            min-width: 103px;
            border: 1px solid #cbd5e1;
            background: #fff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            color: #0f172a;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }

          .followRoot__followingBtn {
            padding: ${expand ? "9px 7px" : "9px 35px"}; 
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
              // min-height: 25vh;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
              padding: 20px;
            }
          }

          @media (min-width: 768px) {
            .followRoot__followBtn, .followRoot__followingBtn {
              padding: 10px 16px !important;
            }
          }

          @media (min-width: 1024px) {
            .popup__cnt {
              height: 220px;
              width: 656px;
              padding: 24px;
            }

            .followRoot__followBtn {
              padding: 10px 16px !important;
            }

            .followRoot__followingBtn {
              padding: 10px 16px;
            }

            .followRoot__unfollow__popup {
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

export default FollowButton;
