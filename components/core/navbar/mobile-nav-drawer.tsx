/**
 * MobileNavDrawer component renders the mobile navigation drawer with menu, support, and user actions.
 *
 * - Handles navigation, analytics, and logout
 * - Renders menu options, support/settings, and login/logout
 *
 * @component
 * @param {IMobileNavDrawer} props - Component props
 * @returns {JSX.Element}
 */
import { EVENTS, HELPER_MENU_OPTIONS, NAV_OPTIONS, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import JoinNetwork from './join-network';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import useClickedOutside from '@/hooks/useClickedOutside';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { toast } from 'react-toastify';
import { createLogoutChannel } from '@/components/core/login/broadcast-channel';
import LoginBtn from './login-btn';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { usePostHog } from 'posthog-js/react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

/**
 * Props for MobileNavDrawer component.
 * @interface IMobileNavDrawer
 * @property {IUserInfo} userInfo - User info object
 * @property {boolean} isLoggedIn - Whether the user is logged in
 * @property {() => void} onNavMenuClick - Callback for closing the nav menu
 */
interface IMobileNavDrawer {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  onNavMenuClick: () => void;
}

/**
 * MobileNavDrawer main functional component.
 * @param {Readonly<IMobileNavDrawer>} props
 * @returns {JSX.Element}
 */
export default function MobileNavDrawer(props: Readonly<IMobileNavDrawer>) {
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

  useClickedOutside({ callback: () => onNavMenuClick(), ref: drawerRef });

  /**
   * Handles navigation item click.
   * - Navigates if not already on the page
   * - Triggers loader and analytics
   * @param url - The target URL
   * @param name - The nav item name
   */
  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      onNavMenuClick();
      triggerLoader(true);
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
    }
  };

  /**
   * Handles help/support item click.
   * - Closes menu and tracks analytics
   * @param name - The help item name
   */
  const onHelpItemClickHandler = (name: string) => {
    onNavMenuClick();
    analytics.onNavGetHelpItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  /**
   * Handles account option click (settings/logout).
   * - Closes menu and tracks analytics
   * @param name - The account option name
   */
  const onAccountOptionClickHandler = (name: string) => {
    onNavMenuClick();
    analytics.onNavAccountItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  /**
   * Handles logout click.
   * - Tracks analytics, clears cookies, broadcasts logout, shows toast
   */
  const onLogoutClickHandler = () => {
    onAccountOptionClickHandler('logout');
    clearAllAuthCookies();
    document.dispatchEvent(new CustomEvent('init-privy-logout'));
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    createLogoutChannel().postMessage('logout');
    postHogProps.reset();
  };

  /**
   * Handles submit team button click.
   * - Tracks analytics and navigates to add team page
   */
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
              <button className="md__container__bdy__clsmenu__btn" onClick={onNavMenuClick}>
                <Image src="/icons/close.svg" height={16} width={16} alt="close" />
                <span> Close Menu</span>
              </button>
            </div>

            {/* Pages */}
            <div className="md__container__bdy__menus">
              {NAV_OPTIONS.map((option, index) => (
                <Link href={option.url} key={`${option.url} + ${index}`} onClick={() => onNavItemClickHandler(option?.url, option?.name)}>
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

            {/* Divider */}
            <div className="md__container__bdy__divder"></div>

            {/* Support & Settings */}
            <div className="md__container__bdy__supandset">
              <h2 className="md__container__bdy__supandset__tle">SUPPORT & SETTINGS</h2>
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
                <Link href={settingsUrl} onClick={() => onAccountOptionClickHandler('settings')}>
                  <li className="md__container__bdy__supandset__optn">
                    <Image width={16} height={16} alt={'Setting'} src="/icons/settings.svg" />
                    <div className="nb__right__helpc__opts__optn__name">Settings</div>
                  </li>
                </Link>
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
              </div>
            )}

            {isLoggedIn && (
              <div className="md__container__bdy__footer__usrop">
                <div className="md__container__bdy__footer__usrop__profilesec">
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
            z-index: 3;
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

          .md__container__bdy__clsmenu {
            padding: 12px 0px;
            display: flex;
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
            color: #475569;
            font-size: 13px;
            line-height: 20px;
            font-weight: 400;
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
            // justify-content: space-between;
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

          @media (min-width: 1024px) {
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
}
