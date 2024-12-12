import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { HOME_PAGE_LINKS } from '@/utils/constants';

const FeaturedHeader = ({ userInfo }: { userInfo: any }) => {
  const analytics = useHomeAnalytics();

  const featuredRequestUrl = HOME_PAGE_LINKS.FEATURED_REQUEST_URL;

  const onSumbitRequestClick = () => {
    analytics.featuredSubmitRequestClicked(getAnalyticsUserInfo(userInfo), featuredRequestUrl as string);
  };

  return (
    <>
      <div className="featured__hdr">
        <div className="featured__ttl__cn">
          <div className="featured__ttl">
            <img className="featured__ttl__img" src="/icons/featured.svg" alt="featured" />
            <h2 className="featured__ttl__txt">Featured</h2>
          </div>
          <div className="featured__hdr__desc">
            <span className="featured__hdr__desc__txt">
              Want to feature your team, project, team people or event?{' '}
              <a
                aria-label="Submit a request to feature content"
                rel="noopener noreferrer"
                href={featuredRequestUrl}
                target="_blank"
                className="featured__hdr__desc__link"
                onClick={onSumbitRequestClick}
              >
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
          gap: 4px;
          align-items: center;
        }

        .featured__ttl__img {
          height: 16px;
          width: 16px;
        }

        .featured__ttl__txt {
          font-size: 16px;
          font-weight: 500;
          line-height: 32px;
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

          .featured__ttl {
            gap: 8px;
          }

          .featured__ttl__img {
            height: 28px;
            width: 28px;
          }

          .featured__ttl__txt {
            font-size: 32px;
            line-height: 28px;
          }
        }
      `}</style>
    </>
  );
};

export default FeaturedHeader;
