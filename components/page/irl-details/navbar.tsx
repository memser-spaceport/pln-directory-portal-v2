'use client';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import Link from 'next/link';

const Navbar = (props: any) => {
  const analytics = useIrlAnalytics();
  const eventDetails = props?.eventDetails;
  const userInfo = props?.userInfo;

  const onNavigate = () => {
    analytics.irlNavbarBackBtnClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
  };

  return (
    <>
      <div className="nav">
        <Link passHref legacyBehavior href="/irl" onClick={onNavigate}>
          <a className="nav__backBtn__mob">
            <img src="/icons/left-arrow-blue.svg" alt="left arrow" width={16} height={16} />
            Back
          </a>
        </Link>
        <Link passHref legacyBehavior href="/irl" onClick={onNavigate}>
          <a className="nav__backBtn__desc">
            <img src="/icons/left-arrow-blue.svg" alt="left arrow" />
            Back to IRL Gatherings
          </a>
        </Link>
      </div>
      <style jsx>{`
        .nav {
          height: inherit;
          display: flex;
          align-items: center;
          padding-inline: 20px;
        }

        .nav__backBtn__mob,
        .nav__backBtn__desc {
          color: #156ff7;
          font-weight: 500;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          align-items: center;
          gap: 4px;
        }

        .nav__backBtn__desc {
          display: none;
        }

        .nav__backBtn__mob {
          display: flex;
        }

        @media (min-width: 1024px) {
          .nav {
            padding-inline: unset;
          }

          .nav__backBtn__mob {
            display: none;
          }

          .nav__backBtn__desc {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
