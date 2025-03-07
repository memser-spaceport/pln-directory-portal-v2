'use client';

import { triggerLoader } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { useRouter, usePathname } from 'next/navigation';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

const HuskyLink = () => {
  const router = useRouter();
  const pathName = usePathname();
  const analytics = useHuskyAnalytics();

  const onHuskyClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pathName !== PAGE_ROUTES.HUSKY) {
      triggerLoader(true);
    }
    router.push(PAGE_ROUTES.HUSKY);
    analytics.trackPageClicked();
  };

  return (
    <>
      <button onClick={onHuskyClickHandler} className="nb__right__husky" aria-label="Chat with Husky assistant">
        <img width={48} height={48} src="/images/husky/husky-logo.svg" alt="husky" />
      </button>

      <style jsx>{`
        .nb__right__husky {
          background: transparent;
          position: relative;
          cursor: pointer;
        }

        .chat-box {
          position: absolute;
          bottom: -120px;
          right: 0;
          background: black;
          color: white;
          padding: 12px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          width: 210px;
          animation: fadeIn 0.3s ease-in-out;
          z-index: 100;
        }

        .chat-box:after {
          content: '';
          position: absolute;
          top: -8px;
          right: 11px;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 10px solid black;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
        }

        .chat-header__title {
          font-weight: 600;
          font-size: 14px;
          line-height: 24px;
        }

        .chat-text {
          font-size: 14px;
          margin-top: 5px;
          text-align: start;
          line-height: 20px;
        }

        .chat-link {
          text-decoration: underline;
          cursor: pointer;
        }

        button {
          background: transparent;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 1024px) {
          .chat-box {
            width: 270px;
            bottom: -110px;
          }
        }
      `}</style>
    </>
  );
};

export default HuskyLink;
