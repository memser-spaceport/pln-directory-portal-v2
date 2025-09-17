import { HELPER_MENU_OPTIONS, NAV_OPTIONS, PAGE_ROUTES, PROFILE_MENU_OPTIONS, TOAST_MESSAGES } from '@/utils/constants';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useRef } from 'react';
import { Separator } from '@base-ui-components/react/separator';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import { createLogoutChannel } from '@/components/core/login/broadcast-channel';
import LoginBtn from '../../login-btn';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { usePostHog } from 'posthog-js/react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './MobileNavDrawer.module.scss';
import { Signup } from '@/components/core/navbar/components/Signup';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface IMobileNavDrawer {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  onNavMenuClick: () => void;
  authToken: string;
  onShowNotifications: () => void;
  notificationsCount?: number;
  profileFilledPercent?: number | null;
}

export const MobileNavDrawer = (props: Readonly<IMobileNavDrawer>) => {
  const userInfo = props.userInfo;
  const isLoggedIn = props.isLoggedIn;
  const onNavMenuClick = props?.onNavMenuClick;
  const pathName = usePathname();
  const settingsUrl = '/settings';
  const analytics = useCommonAnalytics();
  const postHogProps = usePostHog();
  const drawerRef = useRef(null);
  const router = useRouter();
  const defaultAvatarImage = useDefaultAvatar(userInfo?.name);

  useOnClickOutside([drawerRef], onNavMenuClick);

  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      onNavMenuClick();
      triggerLoader(true);
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
    }
  };

  const onHelpItemClickHandler = (name: string) => {
    onNavMenuClick();
    analytics.onNavGetHelpItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  const onAccountOptionClickHandler = (name: string) => {
    onNavMenuClick();
    analytics.onNavAccountItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  const onLogoutClickHandler = () => {
    onAccountOptionClickHandler('logout');
    clearAllAuthCookies();
    document.dispatchEvent(new CustomEvent('init-privy-logout'));
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    createLogoutChannel().postMessage('logout');
    postHogProps.reset();
  };

  const handleSubmitTeam = () => {
    analytics.onSubmitATeamBtnClicked();
    router.push(PAGE_ROUTES.ADD_TEAM);
    // document.dispatchEvent(new CustomEvent(EVENTS.OPEN_TEAM_REGISTER_DIALOG));
    onNavMenuClick();
  };

  return (
    <>
      <div className="md">
        <div className="md__container" ref={drawerRef}>
          <div className="md__container__bdy">
            {/* Close menu */}
            <div className="md__container__bdy__clsmenu">
              <span>Menu</span>
              <button className="md__container__bdy__clsmenu__btn" onClick={onNavMenuClick}>
                <span>Close</span>
                <Image src="/icons/close.svg" height={16} width={16} alt="close" />
              </button>
            </div>

            {/* Pages */}
            <div className="md__container__bdy__menus">
              {NAV_OPTIONS.map((option, index) => (
                <Link
                  href={option.url}
                  key={`${option.url} + ${index}`}
                  onClick={() => {
                    onNavItemClickHandler(option?.url, option?.name);
                  }}
                >
                  <li key={option.name} tabIndex={0} className={`md__container__bdy__menus__menu ${pathName === option.url ? 'md__container__bdy__menus__menu--active' : ''}`}>
                    <Image
                      loading="lazy"
                      height={20}
                      width={20}
                      className="md__container__bdy__menus__menu__img"
                      src={pathName === option.url ? option.selectedLogo : option.unSelectedLogo}
                      alt={option.name}
                    />
                    <p className="md__container__bdy__menus__menu__name">{option.name}</p>
                  </li>
                </Link>
              ))}
            </div>

            <div className="md__container__bdy__supandset">
              <div className={s.SeparatorWrapper}>
                Profile
                <Separator className={s.Separator} />
              </div>

              {isLoggedIn && (
                <Link onClick={() => onHelpItemClickHandler('My Profile')} target="" href={`/members/${userInfo.uid}`}>
                  <li className="md__container__bdy__supandset__optn">
                    <UserIcon />
                    <div className="nb__right__helpc__opts__optn__name">{userInfo.name ?? userInfo.email}</div>
                    {/*{isNumber(props.profileFilledPercent) && props.profileFilledPercent !== 100 && (*/}
                    {/*  <span className="nb__right_sub">*/}
                    {/*    Filled <div className="nb__right_notifications_count">{props.profileFilledPercent}%</div>*/}
                    {/*  </span>*/}
                    {/*)}*/}
                  </li>
                </Link>
              )}

              {isLoggedIn && (
                <li
                  role="button"
                  onClick={() => {
                    props.onShowNotifications();
                    onNavMenuClick();
                  }}
                  className="md__container__bdy__supandset__optn"
                >
                  <NotificationsIcon />
                  <div className="md__container__bdy__supandset__optn__name">Notifications</div>
                  {!!props.notificationsCount && props.notificationsCount > 0 && <div className="nb__right_notifications_count">{props.notificationsCount}</div>}
                </li>
              )}

              <Link onClick={() => onHelpItemClickHandler('ProtoSphere')} target="_blank" href={process.env.PROTOSPHERE_URL ?? ''}>
                <li className="md__container__bdy__supandset__optn">
                  <MessageIcon />
                  <div className="nb__right__helpc__opts__optn__name">ProtoSphere</div>
                </li>
              </Link>

              <div className={s.SeparatorWrapper}>
                Support
                <Separator className={s.Separator} />
              </div>

              {HELPER_MENU_OPTIONS.map((helperMenu, index) => {
                if (helperMenu.type === 'button' && helperMenu.name === 'Submit a Team' && isLoggedIn) {
                  return (
                    <li key={`${helperMenu} + ${index}`} role="button" onClick={handleSubmitTeam} className="md__container__bdy__supandset__optn">
                      <Image width={16} height={16} alt={helperMenu.name} src={helperMenu.icon} />
                      <div className="md__container__bdy__supandset__optn__name">{helperMenu.name}</div>
                    </li>
                  );
                } else if (helperMenu.type !== 'button') {
                  return (
                    <Link onClick={() => onHelpItemClickHandler(helperMenu.name)} target={helperMenu.type} href={helperMenu.url ?? ''} key={`${helperMenu} + ${index}`}>
                      <li className="md__container__bdy__supandset__optn">
                        <Image width={16} height={16} alt={helperMenu.name} src={helperMenu.icon} />
                        <div className="nb__right__helpc__opts__optn__name">{helperMenu.name}</div>
                        {helperMenu.isExternal && <Image width={20} height={20} alt="arrow-right" src="/icons/arrow-up-gray.svg" />}
                      </li>
                    </Link>
                  );
                }
              })}

              {isLoggedIn && (
                <>
                  <div className={s.SeparatorWrapper}>
                    Settings
                    <Separator className={s.Separator} />
                  </div>
                  <Link href={settingsUrl} onClick={() => onAccountOptionClickHandler('settings')}>
                    <li className="md__container__bdy__supandset__optn">
                      <Image width={16} height={16} alt={'Setting'} src="/icons/settings.svg" />
                      <div className="nb__right__helpc__opts__optn__name">Account Settings</div>
                    </li>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* {isLoggedIn && (
            <div className="md__container__bdy__feedback">
              <button id="directory-feedback-btn" className="md__container__bdy__feedback__btn">
                Feedback
              </button>
            </div>
          )} */}
          {/* Footer */}

          <div className="md__container__bdy__footer">
            {!isLoggedIn && (
              <div className="md__container__bdy__footer__lgnop">
                {/* <button id="directory-feedback-btn" className="md__container__bdy__footer__feedback">
                  Feedback
                </button> */}
                <LoginBtn />
                <Signup />
              </div>
            )}

            {isLoggedIn && (
              <div className="md__container__bdy__footer__usrop">
                <div
                  className="md__container__bdy__footer__usrop__profilesec"
                  onClick={() => {
                    onHelpItemClickHandler('My Profile');
                    router.push(`/members/${userInfo.uid}`);
                  }}
                >
                  <img className="md__container__bdy__footer__usrop__profilesec__profile" src={userInfo?.profileImageUrl || defaultAvatarImage} alt="profile" height={40} width={40} />
                  <div className="md__container__bdy__footer__usrop__profilesec__name">{userInfo?.name}</div>
                </div>
                <button className="md__container__bdy__footer__usrop__lgout" onClick={onLogoutClickHandler}>
                  <Image src={'/icons/logout.svg'} alt="logout" height={16} width={16} />
                  <p>Logout</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>
        {`
          button {
            cursor: pointer;
            border: none;
            outline: none;
            background: none;
          }
          .md {
            position: fixed;
            right: 0;
            z-index: 12;
            top: 0;
            background-color: rgb(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
          }

          .md__container {
            height: 100%;
            position: relative;
            width: 320px;
            background: white;
          }

          .md__container__bdy {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 10px 0px;
            height: calc(100dvh - 60px);
            width: 100%;
            position: relative;
            overflow: auto;
            background-color: white;
          }

          .md__container__bdy__clsmenu > span {
            font-size: 14px;
            color: #64748b;
          }

          .md__container__bdy__clsmenu {
            padding: 12px 0px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            padding-right: 20px;
            padding-left: 20px;
          }

          .md__container__bdy__clsmenu__btn {
            outline: none;
            border: none;
            background: none;
            display: flex;
            gap: 4px;
            align-items: center;
            line-height: 20px;
            font-weight: 400;
            font-size: 10px;
            color: #cad3df;
          }

          .md__container__bdy__menus {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding-right: 20px;
            padding-left: 20px;
          }

          .nb__left__web-optns {
            display: none;
          }

          .md__container__bdy__menus__menu {
            display: flex;
            color: #475569;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
          }

          .md__container__bdy__menus__menu:focus {
            border-radius: 0.5rem;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            box-shadow: 0px 0px 0px 2px #156ff740;
            outline-color: #156ff7;
          }

          .md__container__bdy__menus__menu--active {
            background-color: #f1f5f9;
            border-radius: 8px;
            color: #000;
          }

          .md__container__bdy__menus__menu__img {
            display: inline-block;
            padding-right: 8px;
            vertical-align: middle;
          }

          .md__container__bdy__menus__menu__name {
            display: inline-block;
            vertical-align: middle;
          }

          .md__container__bdy__divder {
            border-bottom: 1px solid #e2e8f0;
          }

          .md__container__bdy__supandset {
            display: flex;
            flex-direction: column;
            padding: 0 20px;
            gap: 16px;
          }

          .md__container__bdy__supandset__tle {
            color: #94a3b8;
            font-size: 12px;
            line-height: 20px;
            font-weight: 500;
          }

          .md__container__bdy__supandset__optn {
            display: flex;
            padding: 10px 12px;
            align-items: center;
            gap: 8px;
          }

          .md__container__bdy__feedback {
            padding: 10px;
          }

          .md__container__bdy__feedback__btn {
            position: absolute;
            bottom: 60px;
            padding: 8px 12px;
            border: 1px solid #156ff7;
            border-radius: 100px;
            background-color: #ffffff;
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            width: 93%;
          }

          .md__container__bdy__footer {
            position: absolute;
            bottom: 0;
            padding: 10px 16px;
            height: 60px;
            background-color: white;
            width: 100%;
            border-top: 1px solid #e2e8f0;
          }

          .md__container__bdy__footer__lgnop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
          }

          .md__container__bdy__footer__lgnop__lgnbt {
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            box-shadow: 0px 1px 1px 0px #07080829;
            padding: 8px 24px;
            color: #ffffff;
            font-size: 15px;
            line-height: 24px;
            font-weight: 600;
            border-radius: 100px;
          }

          .md__container__bdy__footer__usrop {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }

          .md__container__bdy__footer__usrop__profilesec {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .md__container__bdy__footer__usrop__profilesec__profile {
            border-radius: 40px;
            border: 1px solid #e2e8f0;
          }

          .md__container__bdy__footer__usrop__profilesec__name {
            width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #64748b;
            font-size: 13px;
            line-height: 14px;
            font-weight: 400;
          }

          .md__container__bdy__footer__usrop__lgout {
            display: flex;
            gap: 4px;
            align-items: center;
            font-weight: 400;
            line-height: 20px;
            font-weight: 400;
            color: #475569;
          }

          .md__container__bdy__footer__feedback {
            padding: 8px 12px;
            border: 1px solid #156ff7;
            border-radius: 100px;
            background-color: #ffffff;
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
          }

          .nb__right_notifications_count {
            background: #ff820e;
            border: 1px solid #ffffff;
            border-radius: 5px;
            z-index: 2;
            min-width: 15px;
            width: fit-content;
            display: flex;
            align-items: center;
            justify-content: center;

            padding-block: 2px;
            padding-inline: 4px;
            flex-direction: column;
            flex-shrink: 0;

            color: #fff;
            text-align: center;
            font-size: 10px;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
            margin-left: auto;
          }

          .nb__right_notifications_count {
            background: #ff820e;
            border: 1px solid #ffffff;
            border-radius: 5px;
            z-index: 2;
            min-width: 15px;
            width: fit-content;
            display: flex;
            align-items: center;
            justify-content: center;

            padding-block: 2px;
            padding-inline: 4px;
            flex-direction: column;
            flex-shrink: 0;

            color: #fff;
            text-align: center;
            font-size: 10px;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
            margin-left: auto;
          }

          .nb__right_sub {
            display: flex;
            align-items: center;
            color: #cad3df;
            font-feature-settings:
              'liga' off,
              'clig' off;
            font-size: 10px;
            font-style: normal;
            font-weight: 400;
            line-height: 14px; /* 140% */
            margin-left: auto;
            gap: 4px;
            position: relative;
          }

          @media (min-width: 1025px) {
            .md {
              display: none;
            }
          }
        `}
      </style>
      {/* <style jsx global>
        {`
        html {
        overflow: ${isOpen ? 'hidden' : 'auto'};
        }`}
      </style> */}
    </>
  );
};

function UserIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 3.8125C9.3125 3.8125 10.4062 4.90625 10.4062 6.21875C10.4062 7.55859 9.3125 8.625 8 8.625C6.66016 8.625 5.59375 7.55859 5.59375 6.21875C5.59375 4.90625 6.66016 3.8125 8 3.8125ZM8 7.3125C8.60156 7.3125 9.09375 6.84766 9.09375 6.21875C9.09375 5.61719 8.60156 5.125 8 5.125C7.37109 5.125 6.90625 5.61719 6.90625 6.21875C6.90625 6.84766 7.37109 7.3125 8 7.3125ZM8 0.75C11.8555 0.75 15 3.89453 15 7.75C15 11.6328 11.8555 14.75 8 14.75C4.11719 14.75 1 11.6328 1 7.75C1 3.89453 4.11719 0.75 8 0.75ZM8 13.4375C9.25781 13.4375 10.4336 13.0273 11.3906 12.3164C10.9258 11.4141 9.99609 10.8125 8.95703 10.8125H7.01562C5.97656 10.8125 5.04688 11.3867 4.58203 12.3164C5.53906 13.0273 6.71484 13.4375 8 13.4375ZM12.375 11.3867C13.1953 10.4023 13.6875 9.14453 13.6875 7.75C13.6875 4.63281 11.1172 2.0625 8 2.0625C4.85547 2.0625 2.3125 4.63281 2.3125 7.75C2.3125 9.14453 2.77734 10.4023 3.59766 11.3867C4.33594 10.2383 5.59375 9.5 7.01562 9.5H8.95703C10.3789 9.5 11.6367 10.2383 12.375 11.3867Z"
        fill="#64748B"
      />
    </svg>
  );
}

function NotificationsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.875 1.625V2.11719C10.8438 2.44531 12.375 4.16797 12.375 6.21875V7.14844C12.375 8.37891 12.7852 9.58203 13.5508 10.5664L13.9609 11.0586C14.125 11.2773 14.1523 11.5508 14.043 11.7695C13.9336 11.9883 13.7148 12.125 13.4688 12.125H2.53125C2.25781 12.125 2.03906 11.9883 1.92969 11.7695C1.82031 11.5508 1.84766 11.2773 2.01172 11.0586L2.42188 10.5664C3.1875 9.58203 3.625 8.37891 3.625 7.14844V6.21875C3.625 4.16797 5.12891 2.44531 7.125 2.11719V1.625C7.125 1.16016 7.50781 0.75 8 0.75C8.46484 0.75 8.875 1.16016 8.875 1.625ZM7.78125 3.375C6.19531 3.375 4.9375 4.66016 4.9375 6.21875V7.14844C4.9375 8.46094 4.55469 9.71875 3.84375 10.8125H12.1289C11.418 9.71875 11.0625 8.46094 11.0625 7.14844V6.21875C11.0625 4.66016 9.77734 3.375 8.21875 3.375H7.78125ZM9.75 13C9.75 13.4648 9.55859 13.9297 9.23047 14.2578C8.90234 14.5859 8.4375 14.75 8 14.75C7.53516 14.75 7.07031 14.5859 6.74219 14.2578C6.41406 13.9297 6.25 13.4648 6.25 13H9.75Z"
        fill="#64748B"
      />
    </svg>
  );
}

function MessageIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10.8438 4.6875C11.1992 4.6875 11.5 4.98828 11.5 5.34375C11.5 5.72656 11.1992 6 10.8438 6H5.15625C4.77344 6 4.5 5.72656 4.5 5.34375C4.5 4.98828 4.77344 4.6875 5.15625 4.6875H10.8438ZM8.21875 7.3125C8.57422 7.3125 8.875 7.61328 8.875 7.96875C8.875 8.35156 8.57422 8.625 8.21875 8.625H5.15625C4.77344 8.625 4.5 8.35156 4.5 7.96875C4.5 7.61328 4.77344 7.3125 5.15625 7.3125H8.21875ZM13.2227 0.75C14.207 0.75 14.9727 1.54297 14.9727 2.5V10.3203C14.9727 11.25 14.1797 12.043 13.2227 12.043H9.28516L5.86719 14.6133C5.64844 14.75 5.34766 14.6133 5.34766 14.3398V12.0703H2.72266C1.73828 12.0703 0.972656 11.3047 0.972656 10.3477V2.5C0.972656 1.54297 1.73828 0.75 2.72266 0.75H13.2227ZM13.6875 10.375V2.5C13.6875 2.28125 13.4688 2.0625 13.25 2.0625H2.75C2.50391 2.0625 2.3125 2.28125 2.3125 2.5V10.375C2.3125 10.6211 2.50391 10.8125 2.75 10.8125H6.6875V12.4531L8.875 10.8125H13.25C13.4688 10.8125 13.6875 10.6211 13.6875 10.375Z"
        fill="#64748B"
      />
    </svg>
  );
}
