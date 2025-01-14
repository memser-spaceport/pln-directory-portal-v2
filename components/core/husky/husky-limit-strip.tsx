import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type HuskyLimitStrip = {
  onClose: () => void;
  type: 'warn' | 'info' | 'close' | 'finalRequest';
  count: number;
  onDialogClose: any;
  mode: 'blog' | 'chat';
};

const HuskyLimitStrip = ({ onClose, type, count, onDialogClose, mode }: HuskyLimitStrip) => {
  const analytics = useAuthAnalytics();
  const router = useRouter();

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    window.location.href = PAGE_ROUTES.SIGNUP;
  };

  const onLoginClickHandler = () => {
    onDialogClose();
    analytics.onLoginBtnClicked();
    const userInfo = Cookies.get('userInfo');
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
          {type === 'info' ? <img height={18} width={18} src="/icons/info-blue.svg" alt="info" /> : <img height={18} width={18} src="/icons/info-red.svg" alt="info" />}
          <p>
            {type === 'info' ? (
              <span className="highlight">
                {count} {count === 1 ? 'response' : 'response(s)'} remaining
              </span>
            ) : (
              <span className="warn">Limit reached</span>
            )}{' '}
            | {type === 'info' ? <span>Husky is running out of bones!</span> : <span>Husky is done fetching for the day!</span>}{' '}
            <span onClick={onLoginClickHandler} role="a" className="link">
              Log in
            </span>{' '}
            or{' '}
            <span onClick={handleSignUpClick} role="a" className="link">
              Sign up
            </span>{' '}
            to get unlimited responses
          </p>
        </div>
        {type === 'info' && (
          <button onClick={onClose}>
            <img height={10} width={10} src="/icons/close-blue.svg" alt="close" />
          </button>
        )}
      </div>
      <style jsx>{`
        .husky-limit-strip {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          gap: 20px;
          border-radius: ${mode === 'blog' ? '8px' : '8px 8px 0px 0px'};
        }

        .husky-limit-strip__text {
          display: flex;
          gap: 3px;
          align-items: center;
        }

        .link {
          color: #156ff7;
          cursor: pointer;
        }

        .highlight {
          color: #156ff7;
          font-weight: 600;
        }

        .info {
          border: 1px solid #cbd5e1;
          background: #dbeafe;
          border-radius: 8px;
        }

        .warn {
          color: #dd2c5a;
          font-weight: 600;
        }

        .error {
          border: 1px solid #ff7777;
          background: #f2e0e5;
          border-bottom: ${mode === 'blog' ? '' : '0px'};
        }

        button {
          background: transparent;
        }

        @media (min-width: 1024px) {
          .husky-limit-strip {
            padding: 12px 12px 12px 20px;
          }

          .husky-limit-strip__text {
            align-items: start;
          }
        }
      `}</style>
    </>
  );
};

export default HuskyLimitStrip;
