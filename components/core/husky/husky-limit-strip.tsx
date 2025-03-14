import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import { PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type HuskyLimitStrip = {
  type: 'warn' | 'info' | 'close' | 'finalRequest';
  count: number;
  onDialogClose?: any;
  mode: 'blog' | 'chat';
  from: string
};

const HuskyLimitStrip = ({ type, count, onDialogClose, mode, from }: HuskyLimitStrip) => {
  const analytics = useHuskyAnalytics();
  const router = useRouter();

  const handleSignUpClick = () => {
    analytics.trackSignupFromHuskyChat(from);
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  const onLoginClickHandler = () => {
    if (onDialogClose) {
      onDialogClose();
    }
    analytics.trackLoginFromHuskyChat(from);
    const userInfo = Cookies.get(`${process.env.COOKIE_PREFIX}-userInfo`);
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };

  return (
    <>
      <div className={`husky-limit-strip ${type === 'info' ? 'info' : 'error'}`}>
        <div className="husky-limit-strip__text">
          <span className="husky-limit-strip__text__iconWrpr">
            {type === 'info' ? (
              <img className="icon" height={18} width={18} src="/icons/info-dark-yellow.svg" alt="info" />
            ) : (
              <img className="icon" height={18} width={18} src="/icons/info-orange.svg" alt="info" />
            )}
            {type === 'info' ? (
              <span className="highlight">
                {count} {count === 1 ? 'request' : 'requests'} remaining
              </span>
            ) : (
              <span className="warn">Limit reached</span>
            )}
          </span>
          <p className="husky-limit-strip__text__wrpr">
            {' '}
            <span className="seperator">|</span>{' '}
            {type === 'info' ? (
              <span className="husky-limit-strip__text__huskyMsg">Husky is running out of bones!</span>
            ) : (
              <span className="husky-limit-strip__text__huskyMsg">Husky is done fetching for the day!</span>
            )}{' '}
            <span>
              <span onClick={onLoginClickHandler} role="a" className="link">
                Log in
              </span>{' '}
              or{' '}
              <span onClick={handleSignUpClick} role="a" className="link">
                Sign up
              </span>{' '}
              to get unlimited requests
            </span>
          </p>
        </div>
        {/* {type === 'info' && (
          <button onClick={onClose}>
            <img height={10} width={10} src="/icons/close-blue.svg" alt="close" />
          </button>
        )} */}
      </div>
      <style jsx>{`
        .husky-limit-strip {
          font-size: 12px;
          font-weight: 400;
          line-height: 20px;
          display: flex;
          justify-content: center;
          padding: 8px;
          gap: 20px;
          border-radius: 0px;
        }

        .husky-limit-strip__text {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .link {
          color: #156ff7;
          cursor: pointer;
        }

        .highlight {
          color: #d3a119;
          font-weight: 600;
        }

        .info {
          background: #fff4cc;
          border-bottom: ${mode === 'blog' ? '' : '0px'};
        }

        .warn {
          color: #ff820e;
          font-weight: 600;
        }

        .error {
          background: #ffe8cc;
          border-bottom: ${mode === 'blog' ? '' : '0px'};
        }

        button {
          background: transparent;
        }

        .husky-limit-strip__text__huskyMsg {
          display: none;
        }

        .seperator {
          display: none;
          color: #64748b;
        }

        .husky-limit-strip__text__iconWrpr {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .icon {
          display: none;
        }

        @media (min-width: 1024px) {
          .husky-limit-strip {
            font-size: 14px;
            padding: 12px 12px 12px 20px;
            justify-content: unset;
            border-radius: ${mode === 'blog' ? '8px' : '8px 8px 0px 0px'};
          }

          .husky-limit-strip__text {
            align-items: start;
            flex-direction: row;
            gap: 4px;
          }

          .husky-limit-strip__text__huskyMsg {
            display: block;
          }
          .seperator {
            display: block;
          }

          .husky-limit-strip__text__wrpr {
            display: flex;
            gap: 4px;
          }

          .info {
            border: 1px solid #d4a116;
          }

          .icon {
            display: block;
          }
          .error {
            border: 1px solid #ff820e;
          }
        }
      `}</style>
    </>
  );
};

export default HuskyLimitStrip;
