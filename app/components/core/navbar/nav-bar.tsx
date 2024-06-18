'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { EVENTS, HELPER_MENU_OPTIONS, NAV_OPTIONS } from '@/utils/constants';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/helper';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import JoinNetwork from './join-network';
import MobileNavDrawer from './mobile-nav-drawer';
import UserProfile from './userProfile';
import { useRef } from 'react';
import { IUserInfo } from '@/types/shared.types';

interface INavbar {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export default function Navbar(props: Readonly<INavbar>) {
  const pathName = usePathname();
  const userInfo = props?.userInfo;
  const isLoggedIn = props?.isLoggedIn;
  const analytics = useCommonAnalytics();

  const helpMenuRef = useRef<HTMLDivElement>(null);

  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
      triggerLoader(true);
    }
  };

  const onLoginClickHandler = () => {};

  const onHelpClickHandler = () => {
    analytics.onNavItemClicked('get-help', getAnalyticsUserInfo(userInfo));
  };

  const onHelpItemClickHandler = (name: string) => {
    helpMenuRef?.current?.hidePopover();
    analytics.onNavGetHelpItemClicked(name, getAnalyticsUserInfo(userInfo));
  };

  const onNavDrawerIconClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_MOBILE_NAV, { detail: true }));
    analytics.onNavDrawerBtnClicked(true);
  };

  return (
    <>
      <div className="nb">
        <MobileNavDrawer userInfo={userInfo} isLoggedIn={isLoggedIn} />
        <div className="nb__left">
          <Link href="/">
            <Image src="/icons/app-logo.svg" height={35} width={157} alt="app-logo" />
          </Link>
          <div className="nb__left__web-optns">
            {NAV_OPTIONS.map((option, index) => (
              <Link
                href={option.url}
                key={`${option.url} + ${index}`}
                onClick={() => onNavItemClickHandler(option?.url, option?.name)}
              >
                <li
                  key={option.name}
                  tabIndex={0}
                  className={`nb__left__web-optns__optn ${
                    pathName === option.url ? 'nb__left__web-optns__optn--active' : ''
                  }`}
                >
                  <Image
                    loading="lazy"
                    height={20}
                    width={20}
                    className="nb__left__web-optns__optn__img"
                    src={pathName === option.url ? option.selectedLogo : option.unSelectedLogo}
                    alt={option.name}
                  />
                  <p className="nb__left__web-optns__optn__name">{option.name}</p>
                </li>
              </Link>
            ))}
          </div>
        </div>
        <div className="nb__right">
          <div className="nb__right__helpc">
            <button onClick={onHelpClickHandler} popoverTarget="help" className="nb__right__helpc__btn">
              <Image
                className="nb__right__helpc__btn__img"
                alt="help"
                loading="lazy"
                height={24}
                width={24}
                src="/icons/help.svg"
              />
            </button>
            <div className="nb__right__helpc__opts" ref={helpMenuRef} popover="auto" id="help">
              {HELPER_MENU_OPTIONS.map((helperMenu, index) => (
                <Link
                  target={helperMenu.type}
                  href={helperMenu.url ?? ''}
                  key={`${helperMenu} + ${index}`}
                  onClick={() => onHelpItemClickHandler(helperMenu.name)}
                >
                  <li className="nb__right__helpc__opts__optn">
                    <Image width={16} height={16} alt={helperMenu.name} src={helperMenu.icon} />
                    <div className="nb__right__helpc__opts__optn__name">{helperMenu.name}</div>
                  </li>
                </Link>
              ))}
            </div>
          </div>
          <button className="nb__right__drawerandprofile__drawerbtn" onClick={onNavDrawerIconClickHandler}>
              <Image src="/icons/nav-drawer.svg" alt="nav-drawer" height={20} width={20} />
            </button>
            {isLoggedIn && <UserProfile userInfo={userInfo} />}
          {!isLoggedIn && (
            <div className="nb__right__lgandjoin">
              <JoinNetwork />
              <button className="nb__right__lgandjoin__lgnbtn" onClick={onLoginClickHandler}>
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .nb {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0px 1px 4px 0px #e2e8f0;
            padding: 0 16px 0px 22px;
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
            vertical-align: middle;
          }

          .nb__right {
            display: flex;
            align-items: center;
            gap: 16px;
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

          :popover-open {
            position: absolute;
            inset: unset;
            bottom: 5px;
            right: ${isLoggedIn ? '128px' : '365px'};
            margin: 0;
            top: 60px;
            border: none;
            background: white;
            border-radius: 8px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .nb__right__helpc {
            display: none;
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
          }

          .nb__right__drawerandprofile {
            display: flex;
            gap: 16px;
            align-items: center;
          }

          @media (min-width: 1024px) {
            .nb {
              padding: 0 48px 0 54px;
            }
            .nb__left {
              display: flex;
              gap: 92px;
              align-items: center;
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
            display: none;}

            .nb__right__lgandjoin {
              display: flex;
              gap: 16px;
              align-items: center;
            }
          }
        `}
      </style>
    </>
  );
}
