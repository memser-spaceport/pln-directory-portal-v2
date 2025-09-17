import React from 'react';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { HOME_PAGE_LINKS } from '@/utils/constants';

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Teams', value: 'team' },
  { label: 'Members', value: 'member' },
  { label: 'Projects', value: 'project' },
  { label: 'Events', value: 'event' },
];

interface FeaturedHeaderProps {
  userInfo: any;
  onClick: (filter: string) => void;
  activeFilter: string;
  prevBtnDisabled?: boolean;
  nextBtnDisabled?: boolean;
  onPrevButtonClick?: () => void;
  onNextButtonClick?: () => void;
}

const FeaturedHeader = ({ userInfo, onClick, activeFilter }: FeaturedHeaderProps) => {
  const analytics = useHomeAnalytics();

  const onFilterButtonClick = (filterValue: string) => {
    onClick(filterValue);
    analytics.onFeaturedFilterClicked(filterValue);
  };

  const featuredRequestUrl = HOME_PAGE_LINKS.FEATURED_REQUEST_URL;

  const onSumbitRequestClick = () => {
    analytics.featuredSubmitRequestClicked(getAnalyticsUserInfo(userInfo), featuredRequestUrl as string);
  };

  return (
    <>
      <div className="featured__hdr">
        <div className="featured__ttl__cn">
          <div className="featured__ttl">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={`featured__ttl__txt${activeFilter === option.value ? ' active' : ''}`}
                onClick={() => onFilterButtonClick(option.value)}
                type="button"
                aria-pressed={activeFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* <div className="featured__hdr__desc">
            <span className="featured__hdr__desc__txt">
              Want to feature your team, project, team member or event?{' '}
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
          </div> */}
        </div>
      </div>
      <style jsx>{`
        .featured__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e3e3e3;
          padding-top: 24px;
        }

        .featured__hdr__actions {
          display: none;
          gap: 4px;
          align-items: center;
        }

        .featured__ttl {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .featured__ttl__txt {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
          cursor: pointer;
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
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }

        .featured__hdr__actions__left:hover .featured__hdr__actions__left__img {
          content: url('/icons/left-arrow-circle-blue.svg');
        }

        .featured__hdr__actions__right:hover .featured__hdr__actions__right__img {
          content: url('/icons/right-arrow-circle-blue.svg');
        }

        .featured__ttl__txt.active {
          color: #333333;
          font-weight: 600;
          font-size: 14px;
        }

        @media (min-width: 1024px) {
          .featured__hdr__actions {
            display: flex;
          }
        }

        @media (max-width: 768px) {
          .featured__ttl__cn {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </>
  );
};

export default FeaturedHeader;
