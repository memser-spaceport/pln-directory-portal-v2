'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import useClickedOutside from '@/hooks/useClickedOutside';
import { getFollowUps } from '@/services/office-hours.service';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { EVENTS, HELPER_MENU_OPTIONS, NAV_OPTIONS, PAGE_ROUTES } from '@/utils/constants';
import cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import AllNotifications from './all-notifications';
import JoinNetwork from './join-network';
import LoginBtn from './login-btn';
import MobileNavDrawer from './mobile-nav-drawer';
import UserProfile from './userProfile';
import SignUpBtn from './sign-up';

interface INavbar {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

export default function Navbar(props: Readonly<INavbar>) {
  const pathName = usePathname();
  const userInfo = props?.userInfo;
  const isLoggedIn = props?.isLoggedIn;
  const analytics = useCommonAnalytics();
  const authToken = props?.authToken;
  const router = useRouter();

  const helpMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLButtonElement>(null);
  const [isHelperMenuOpen, setIsHelperMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobilDrawerOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isNotification, setIsNotification] = useState(false);

  useClickedOutside({ callback: () => setIsHelperMenuOpen(false), ref: helpMenuRef });
  useClickedOutside({ callback: () => setIsNotification(false), ref: notificationRef });

  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      triggerLoader(true);
    }
    if (pathName !== url) {
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
    }
  };

  const onHelpClickHandler = (e: SyntheticEvent) => {
    e.preventDefault();
    setIsHelperMenuOpen((prev) => !prev);
    analytics.onNavItemClicked('get-help', getAnalyticsUserInfo(userInfo));
  };

  const onHelpItemClickHandler = (name: string) => {
    // helpMenuRef?.current?.hidePopover();
    setIsHelperMenuOpen(false);
    analytics.onNavGetHelpItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  const onNavDrawerIconClickHandler = () => {
    // document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_MOBILE_NAV, { detail: true }));
    setIsMobilDrawerOpen((prev) => !prev);
    analytics.onNavDrawerBtnClicked(isMobileDrawerOpen);
  };

  const onNavbarApplogoClicked = () => {
    analytics.onAppLogoClicked();
  };

  useEffect(() => {
    async function getAllNotifications(status: boolean) {
      if (status && isLoggedIn) {
        const response = await getFollowUps(userInfo.uid ?? '', authToken, 'PENDING,CLOSED');
        const result = response?.data ?? [];
        setNotifications(result);
      }
    }

    document.addEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));
    getAllNotifications(true);

    return function () {
      document.removeEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));
    };
  }, []);

  const onNotificationClickHandler = () => {
    analytics.onNotificationMenuClickHandler(getAnalyticsUserInfo(userInfo));
    setIsNotification(!isNotification);
  };

  const handleSubmitTeam = () => {
    analytics.onSubmitATeamBtnClicked();
    // document.dispatchEvent(new CustomEvent(EVENTS.OPEN_TEAM_REGISTER_DIALOG));
    router.push(PAGE_ROUTES.ADD_TEAM);
    setIsHelperMenuOpen(false);
  };

  return (
    <>
      <div className="nb">
        {isMobileDrawerOpen && <MobileNavDrawer userInfo={userInfo} isLoggedIn={isLoggedIn} onNavMenuClick={onNavDrawerIconClickHandler} />}
        <div className="nb__left">
          <Link href="/" onClick={onNavbarApplogoClicked}>
            <Image quality={60} priority src="/icons/app-logo.svg" height={35} width={157} alt="app-logo" />
          </Link>
          <div className="nb__left__web-optns">
            {NAV_OPTIONS.map((option, index) => (
              <Link href={option.url} key={`${option.url} + ${index}`} onClick={() => onNavItemClickHandler(option?.url, option?.name)}>
                <li key={option.name} tabIndex={0} className={`nb__left__web-optns__optn ${pathName === option.url ? 'nb__left__web-optns__optn--active' : ''}`}>
                  <Image height={20} width={20} className="nb__left__web-optns__optn__img" src={pathName === option.url ? option.selectedLogo : option.unSelectedLogo} alt={option.name} />
                  <p className="nb__left__web-optns__optn__name">{option.name}</p>
                </li>
              </Link>
            ))}
          </div>
        </div>
        <div className="nb__right">
          {isLoggedIn && (
            <>
              {/* <div className="nb__right__team" onClick={handleSubmitTeam}>
                Submit a Team
              </div> */}
              <div className="nb__right__ntc">
                <button ref={notificationRef} className={`nb__right__ntc__btn ${notifications?.length > 0 ? 'shake' : ''}`} onClick={onNotificationClickHandler}>
                  <img alt="notification" src="/icons/bell.svg" />
                </button>
                {notifications?.length > 0 && <div className="nb__right__ntc__new">{notifications?.length}</div>}
                {isNotification && (
                  <div className="nb__right__ntc__allntn">
                    <AllNotifications userInfo={userInfo} allNotifications={notifications} />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="nb__right__helpc" ref={helpMenuRef}>
            <button onClick={onHelpClickHandler} className="nb__right__helpc__btn">
              <Image className="nb__right__helpc__btn__img" alt="help" loading="lazy" height={24} width={24} src="/icons/help.svg" />
            </button>
            {isHelperMenuOpen && (
              <div className="nb__right__helpc__opts">
                {HELPER_MENU_OPTIONS.map((helperMenu, index) => {
                  if (helperMenu.type === 'button' && helperMenu.name === 'Submit a Team' && isLoggedIn) {
                    return (
                      <li key={`${helperMenu} + ${index}`} role="button" onClick={handleSubmitTeam} className="nb__right__helpc__opts__optn">
                        <Image width={16} height={16} alt={helperMenu.name} src={helperMenu.icon} />
                        <div className="nb__right__helpc__opts__optn__name">{helperMenu.name}</div>
                      </li>
                    );
                  } else if (helperMenu.type !== 'button') {
                    return (
                      <Link target={helperMenu.type} href={helperMenu.url ?? ''} key={`${helperMenu} + ${index}`} onClick={() => onHelpItemClickHandler(helperMenu.name)}>
                        <li className="nb__right__helpc__opts__optn">
                          <Image width={16} height={16} alt={helperMenu.name} src={helperMenu.icon} />
                          <div className="nb__right__helpc__opts__optn__name">{helperMenu.name}</div>
                        </li>
                      </Link>
                    );
                  }
                })}
              </div>
            )}
          </div>
          <div className="nb__right__drawerandprofilesec" onClick={onNavDrawerIconClickHandler}>
            <button className="nb__right__drawerandprofile__drawerbtn">
              <Image src="/icons/nav-drawer.svg" alt="nav-drawer" height={20} width={20} />
            </button>
            {isLoggedIn && <UserProfile userInfo={userInfo} />}
          </div>
          {!isLoggedIn && (
            <div className="nb__right__lgandjoin">
              <LoginBtn />
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          button {
            background: inherit;
          }
          .nb {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0px 1px 4px 0px #e2e8f0;
            padding: 0 16px 0px 22px;
            gap: 10px;
          }

          button {
            cursor: pointer;
            border: none;
            outline: none;
            background: none;
          }

          .nb__left__web-optns {
            display: none;
          }

          .nb__left__web-optns__optn {
            display: flex;
            color: #475569;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
          }

          .nb__right__team {
            display: flex;
            color: #475569;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            text-align: right;
          }

          .nb__left__web-optns__optn:focus {
            border-radius: 0.5rem;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            box-shadow: 0px 0px 0px 2px #156ff740;
            outline-color: #156ff7;
          }

          .nb__left__web-optns__optn--active {
            background-color: #f1f5f9;
            border-radius: 8px;
            color: #000;
          }

          .nb__left__web-optns__optn__img {
            display: inline-block;
            padding-right: 8px;
            vertical-align: middle;
          }

          .nb__left__web-optns__optn__name {
            display: inline-block;
            white-space: nowrap;
            vertical-align: middle;
          }

          .nb__right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .nb__right__helpc {
            position: relative;
          }

          .nb__right__helpc__btn {
            background: none;
            border: none;
            cursor: pointer;
            position: relative;
          }

          .nb__right__helpc {
            display: none;
          }

          .nb__right__helpc__opts {
            position: absolute;
            right: 0;
            margin-top: 10px;
            padding: 8px;
            background-color: white;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            border-radius: 8px;
            width: 170px;
          }

          .nb__right__helpc__opts__optn:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .nb__right__helpc__opts__optn__name {
            font-size: 14px;
            line-height: 20px;
            font-weight: 400;
          }

          .nb__right__lgandjoin {
            display: none;
          }

          .nb__right__lgandjoin__lgnbtn {
            color: #475569;
            font-size: 15px;
            font-weight: 600;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            box-shadow: 0px 1px 1px 0px #07080829;
            padding: 8px 24px;
            color: #ffffff;
            font-size: 15px;
            line-height: 24px;
            font-weight: 600;
            border-radius: 100px;
            line-height: 24px;
          }

          .nb__right__helpc__opts__optn {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 8px;
            cursor: pointer;
          }

          .nb__right__drawerandprofile {
            display: flex;
            gap: 16px;
            align-items: center;
          }

          .nb__right__drawerandprofilesec {
            display: flex;
            cursor: pointer;
            align-items: center;
            border: ${isLoggedIn ? '1px solid #E2E8F0' : 'none'};
            gap: 4px;
            border-radius: 4px;
            padding: ${isLoggedIn ? '8px' : '0'};
          }

          .nb__right__ntc {
            height: 30px;
            width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
            position: relative;
          }

          .nb__right__ntc__new {
            border-radius: 50%;
            background: #ff820e;
            padding: 3px 2px;
            border: 1px solid #ffffff;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 600;
            color: white;
            z-index: 2;
            position: absolute;
            top: -5px;
            left: 13px;
            min-width: 15px;
            width: fit-content;
            text-align: center;
            height: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .nb__right__ntc__allntn {
            position: absolute;
            max-height: 534px;
            width: 250px;
            z-index: 5;
            right: -10px;
            top: 30px;
            border-radius: 8px;
            background-color: white;
            box-shadow: 0px 2px 6px 0px #0f172a29;
          }

          @keyframes shake {
            0% {
              transform: rotate(0deg);
            }
            10% {
              transform: rotate(-20deg);
            }
            20% {
              transform: rotate(20deg);
            }
            30% {
              transform: rotate(-20deg);
            }
            40% {
              transform: rotate(20deg);
            }
            50% {
              transform: rotate(-20deg);
            }
            60% {
              transform: rotate(20deg);
            }
            70% {
              transform: rotate(-20deg);
            }
            80% {
              transform: rotate(20deg);
            }
            90% {
              transform: rotate(-20deg);
            }
            100% {
              transform: rotate(0deg);
            }
          }

          .nb__right__ntc__btn {
            transition: transform 0.2s ease-in-out;
          }

          .shake {
            animation: shake 1s ease-in-out;
          }

          @media (min-width: 1024px) {
            .nb {
              padding: 0 48px 0 48px;
            }
            .nb__left {
              display: flex;
              gap: 48px;
              align-items: center;
            }

            .nb__right__ntc__allntn {
              width: 400px;
            }

            .nb__right__helpc {
              height: 24px;
              display: unset;
            }
            .nb__left__web-optns {
              display: unset;
              display: flex;
              gap: 16px;
            }

            .nb__right__helpc__opts__optn {
              display: flex;
            }

            .nb__right__drawerandprofile__drawerbtn {
              display: none;
            }

            .nb__right__lgandjoin {
              display: flex;
              gap: 16px;
              align-items: center;
            }

            .nb__right__drawerandprofilesec {
              border: none;
            }

            .nb__right__ntc__allntn {
              right: 10px;
              top: 30px;
              width: 300px;
            }
          }
        `}
      </style>
    </>
  );
}
