'use client';

import Link from 'next/link';

const Navbar = (props: any) => {
  // const analytics = useAppAnalytics();
  const eventDetails = props?.eventDetails;
  // const user = getUserInfo();

  const onNavigate = () => {
    // analytics.captureEvent(APP_ANALYTICS_EVENTS.IRL_NAVBAR_BACK_BTN_CLICKED, {
    //   eventId: eventDetails?.id,
    //   eventName: eventDetails?.name,
    //   user,
    // });
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
