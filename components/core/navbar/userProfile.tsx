'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import useClickedOutside from '@/hooks/useClickedOutside';
import { IUserInfo } from '@/types/shared.types';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Tooltip } from '../tooltip/tooltip';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { toast } from 'react-toastify';
import { createLogoutChannel } from '../login/broadcast-channel';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface IProfile {
  userInfo: IUserInfo;
}

export default function UserProfile(props: Readonly<IProfile>) {
  const [isDropdown, setIsDropdown] = useState(false);
  const profileMenuRef = useRef(null);
  const router = useRouter();

  const analytics = useCommonAnalytics();
  const userInfo = props?.userInfo;

  useClickedOutside({ callback: () => setIsDropdown(false), ref: profileMenuRef });

  const onDrodownClick = () => {
    const mode = isDropdown ? 'close' : 'open';
    setIsDropdown((prev) => !prev);
  };

  const onLogoutHandler = () => {
    setIsDropdown(false);
    clearAllAuthCookies();
    document.dispatchEvent(new CustomEvent('init-privy-logout'));
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    createLogoutChannel().postMessage('logout');
  };

  const onAccountOptionsClickHandler = (name: string) => {
    router.push('/settings/profile');
    analytics.onNavAccountItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  return (
    <div className="profile">
      <div className="profile__profileimgsection">
        <img loading="lazy" src={userInfo?.profileImageUrl || '/icons/default_profile.svg'} alt="profile" height={40} width={40} className="profile__profileimagesection__img" />
        <button ref={profileMenuRef} className="profile__profileimgsection__dropdownbtn" onClick={onDrodownClick}>
          <Image height={20} width={20} loading="lazy" src="/icons/dropdown.svg" alt="dropdown" />
        </button>
        {isDropdown && (
          <div className="profile__profileimagesection__ddown">
            <button className="profile__profileimagesection__ddown__settings" onClick={() => onAccountOptionsClickHandler('settings')}>
              <Image height={16} width={16} loading="lazy" alt="settings" src="/icons/settings.svg" />
              Account Settings
            </button>
            <div className="profile__profileimagesection__ddown__bl"> </div>
            <div onClick={onLogoutHandler} className="profile__profieimagesection__ddown__louts">
              <button className="profile__profieimagesection__ddown__louts__loutbtn" onClickCapture={() => onAccountOptionsClickHandler('logout')}>
                <Image height={16} width={16} loading="lazy" alt="logout" src="/icons/logout.svg" />
                Logout
              </button>
              <Tooltip asChild trigger={<p className="profile__profieimagesection__ddown__louts__uname">{userInfo?.name}</p>} content={userInfo?.name} />
            </div>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .profile {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .profile__navdrawerbtn {
            background: none;
            outline: none;
            border: none;
          }

          button {
            cursor: pointer;
          }

          .profile__about__btn {
            display: none;
          }

          .profile__profileimgsection {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .profile__profileimagesection__img {
            border: 1px solid #e2e8f0;
            border-radius: 50%;
            background-color: #e2e8f0;
            height: 40px;
            width: 40px;
            object-fit: cover;
            object-position: center;
          }

          .profile__profileimgsection__dropdownbtn {
            display: none;
            cursor: pointer;
          }

          .profile__profileimagesection__ddown {
            position: absolute;
            width: 210px;
            border-radius: 8px;
            background: #fff;
            display: inline-flex;
            padding: 8px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            box-shadow: 0px 2px 6px 0px rgba(15, 23, 42, 0.16);
            top: 65px;
            right: 25px;
          }

          .profile__profileimagesection__ddown__settings {
            display: flex;
            align-items: center;
            gap: 4px;
            align-self: stretch;
            background: #fff;
            border: none;
            color: #0f172a;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            padding: 8px;
            width: 100%;
          }

          .profile__profileimagesection__ddown__settings:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .profile__profileimagesection__ddown__bl {
            stroke-width: 1px;
            stroke: #cbd5e1;
            width: 100%;
            border-top: 1px solid #cbd5e1;
          }

          .profile__profieimagesection__ddown__wnew {
            border: none;
            background: #fff;
            display: flex;
            align-items: center;
            gap: 4px;
            align-self: stretch;
            background: #fff;
            border: none;
            color: #0f172a;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .profile__profieimagesection__ddown__louts {
            width: 100%;
            padding: 8px;
          }

          .profile__profieimagesection__ddown__louts:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .profile__profieimagesection__ddown__louts__loutbtn {
            border: none;
            display: flex;
            width: 100%;
            align-items: center;
            gap: 4px;
            align-self: stretch;
            background: transparent;
            border: none;
            color: #0f172a;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .profile__profieimagesection__ddown__louts__uname {
            margin-top: 4px;
            color: #64748b;
            text-align: left;
            font-size: 12px;
            font-weight: 400;
            line-height: 14px;
            width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: default;
          }

          @media (min-width: 1024px) {
            .profile__profileimagesection__ddown {
              right: 65px;
            }

            .profile__navdrawerbtn {
              display: none;
            }

            .profile__profileimgsection__dropdownbtn {
              display: unset;
              border: none;
              background: #fff;
            }

            .profile__about__btn {
              border: none;
              display: unset;
              background: #fff;
            }

            .profile {
              gap: 20px;
            }
          }
        `}
      </style>
    </div>
  );
}
