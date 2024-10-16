import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

const DiscoverHuskyCard = (props: any) => {
  const analytics = useHomeAnalytics();
  const userInfo = props?.userInfo;

  const onHuskyClick = () => {
    analytics.onDiscoverHuskyClicked({ from: 'home page' }, getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent('open-husky-dialog'));
  };

  return (
    <>
      <div className="dh" data-testid= "discover-husky-card" role="button" onClick={onHuskyClick} aria-label="Discover more using Husky">
        <img className="dh__pattern-1" src="/images/discover/discover-husky-pattern-1.svg" alt="Decorative pattern 1" aria-hidden="true" />
        <img className="dh__pattern-2" src="/images/discover/discover-husky-pattern-2.svg" alt="Decorative pattern 2" aria-hidden="true" />
        <img className="dh__pattern-3" src="/images/discover/discover-husky-pattern-3.svg" alt="Decorative pattern 3" aria-hidden="true" />

        <div className="dh__body">
          <div className="dh__text">
            Discover more
            <br />
            using Husky
          </div>
          <button className="dh__btn" aria-label="Discover more using Husky">
            <img height={16} width={14} src="/icons/right-arrow-white.svg" alt="Right arrow icon" />
          </button>
        </div>
      </div>
      <style jsx>{`
        .dh {
          position: relative;
          z-index: 1;
          background: #ffffff;
          box-shadow: 0px 4px 4px 0px #0F172A0, 0px 0px 1px 0px #0f172a1f;
          border-radius: 12px;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 1px solid #e2e8f0;
        }

        .dh:hover {
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .dh__pattern-1 {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: -1;
          border-radius: 0 0 12px 0;
          // width: 50%;
        }

        .dh__pattern-2 {
          position: absolute;
          right: 0;
          top: 0;
          z-index: -1;
          border-radius: 0 12px 0 0;
        }

        .dh__pattern-3 {
          position: absolute;
          bottom: 0;
          left: 0;
          z-index: -1;
          border-radius: 0 0 0 12px;
        }

        .dh__text {
          font-size: 19px;
          font-weight: 400;
          line-height: 25px;
          color: #000000;
          text-align: center;
        }

        .dh__btn {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #156ff7;
          border-radius: 50%;
        }

        .dh__body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 17px;
        }

        @media (min-width: 1024px) {
          .dh__text {
            font-size: 25px;
            line-height: 34px;
          }

          .dh__pattern-1 {
            width: unset;
          }
        }
      `}</style>
    </>
  );
};

export default DiscoverHuskyCard;
