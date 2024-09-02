import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

const FeaturedHeader = ({ userInfo }: { userInfo: any }) => {
  const FEATURED_REQUEST_URL = process.env.FEATURED_REQUEST_URL;

  const analytics = useHomeAnalytics();

  const onSumbitRequestClick = () => {
    analytics.featuredSubmitRequestClicked(getAnalyticsUserInfo(userInfo), FEATURED_REQUEST_URL as string);
  };

  return (
    <>
      <div className="featured__hdr">
        <div className="featured__ttl__cn">
          <div className="featured__ttl">
            <img src="/icons/featured.svg" alt="featured" height={28} width={28} />
            <h3 className="featured__ttl__txt">Featured</h3>
          </div>
          <div className="featured__hdr__desc">
            <span className="featured__hdr__desc__txt">
              Want to feature your team, project, team member or event?{' '}
              <a href={FEATURED_REQUEST_URL} target="_blank" className="featured__hdr__desc__link" onClick={onSumbitRequestClick}>
                Submit a request
              </a>
            </span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .featured__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .featured__hdr__actions {
          display: none;
          gap: 4px;
          align-items: center;
        }

        .featured__ttl {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .featured__ttl__txt {
          font-size: 32px;
          font-weight: 500;
          line-height: 28px;
          color: #0f172a;
        }

        .featured__hdr__actions button {
          background: transparent;
        }

        .disabled {
          pointer-events: none;
        }

        .featured__hdr__desc__link {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #156ff7;
          cursor: pointer;
        }

        .featured__hdr__desc__txt {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
        }

        .featured__ttl__cn {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .featured__hdr__actions__left:hover .featured__hdr__actions__left__img {
          content: url('/icons/left-arrow-circle-blue.svg');
        }

        .featured__hdr__actions__right:hover .featured__hdr__actions__right__img {
          content: url('/icons/right-arrow-circle-blue.svg');
        }

        @media (min-width: 1024px) {
          .featured__hdr__actions {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default FeaturedHeader;
