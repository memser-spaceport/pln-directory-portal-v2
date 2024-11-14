/**
 * DiscoverCard component displays a card with information about a discovery.
 * It tracks user interactions and displays analytics data.
 */

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

// Define the props type for the DiscoverCard component
interface DiscoverCardProps {
  data: {
    image: {
      mob: string;
      desktop: string;
    };
    question: string;
    subText?: string;
    viewCount: number;
    shareCount: number;
    answerSourceLinks?: string[];
  };
  userInfo?: any; // Replace with appropriate type if known
}

const DiscoverCard = (props: DiscoverCardProps) => {
  const { data, userInfo } = props;
  const analytics = useHomeAnalytics();

  // Handle click event on the discover card
  const onDiscoverCardClick = () => {
    analytics.onDiscoverCardClicked(data, getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent('open-husky-discover', { detail: data }));
  };

  return (
    <>
      <div data-testid="discover-card" className="discover-card" onClick={onDiscoverCardClick} aria-label={`Discover card for ${data.question}`}>
        <div className="discover-card__pattern">
          <picture>
            <source media="(max-width: 1024px)" srcSet={data.image?.mob} />
            <img className="discover-card__pattern__img" src={data.image?.desktop} alt="pattern" />
          </picture>
        </div>
        <h2 lang="en" className="discover-card__qus" aria-label="Question">
          {data?.question}
        </h2>
        <div className="discover-card__sub__cn">
          <p className="discover-card__sub" aria-label="Subtext">
            {data?.subText}
          </p>
        </div>
        <div className="discover-card_chips" role="list" aria-label="Card statistics">
          <div className="discover-card_chips_chip" role="listitem" aria-label={`${data.viewCount} views`}>
            <img className="discover-card_chips_chip__img" src="/icons/eye-gray.svg" alt="views" />
            <span className="discover-card_chips_chip__txt">{data.viewCount}</span>
          </div>
          <div className="discover-card_chips_chip" role="listitem" aria-label={`${data.shareCount} shares`}>
            <img className="discover-card_chips_chip__img" src="/icons/share-gray.svg" alt="share" />
            <span className="discover-card_chips_chip__txt">{data.shareCount}</span>
          </div>
          <div className="discover-card_chips_chip" role="listitem" aria-label={`${data?.answerSourceLinks?.length} sources`}>
            <img className="discover-card_chips_chip__img" src="/icons/language-gray.svg" alt="sources" />
            <span className="discover-card_chips_chip__txt">{data?.answerSourceLinks?.length} sources</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .discover-card {
          position: relative;
          z-index: 1;
          padding: 16px;
          height: 100%;
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
          border: 1px solid #e2e8f0;
          justify-content: space-between;
        }

        .discover-card:hover {
          box-shadow: 0px 0px 0px 2px #156ff740;
        }

        .discover-card__pattern {
          display: flex;
          justify-content: end;
          position: absolute;
          z-index: -1;
          top: 0;
          right: 0;
        }

        .discover-card__pattern__img {
          border-radius: 12px 12px 0px 0px;
          max-width: 100%;
        }

        .discover-card__qus {
          font-size: 14px;
          font-weight: 500;
          line-height: 18px;
          color: #000000;
          word-break: break-word;
          // overflow: hidden;
          // max-height: 66px;
        }

        .discover-card__sub {
          font-size: 10px;
          font-weight: 400;
          line-height: 16px;
          color: #475569;
          text-overflow: ellipsis;
          overflow: hidden;
          word-break: break-word;
          margin-top: 3px;
          overflow: hidden;
          // max-height: 32px;
        }

        .discover-card__sub__cn {
          flex: 1;
        }

        .discover-card_chips {
          display: flex;
          gap: 5px;
          justify-content: start;
          flex-wrap: wrap;
          margin-top: 11px;
        }

        .discover-card_chips_chip {
          background: #f1f5f9;
          display: inline-flex;
          gap: 2px;
          align-items: center;
          padding: 0px 4px;
          border-radius: 24px;
          height: 18px;
          display: flex;
          align-items: center;
        }

        .discover-card_chips_chip__img {
          width: 12px;
          height: 12px;
        }

        .discover-card_chips_chip__txt {
          font-size: 10px;
          font-weight: 500;
          line-height: 14px;
          text-align: left;
          color: #475569;
        }

        @media (min-width: 1024px) {
          .discover-card__qus {
            font-size: 23px;
            font-weight: 500;
            line-height: 33px;
            // max-height: 99px;
          }

          .discover-card__sub {
            font-size: 14px;
            font-weight: 400;
            line-height: 23px;
            // max-height: 69px;
          }

          .discover-card {
            padding: 20px;
          }

          .discover-card_chips {
            right: 20px;
            bottom: 20px;
            justify-content: end;
            gap: 8px;
            margin-top: 3px;
          }

          .discover-card_chips_chip {
            height: 26px;
            padding: 0px 8px;
          }

          .discover-card_chips_chip__txt {
            font-size: 12px;
            line-height: 14px;
          }

          .discover-card_chips_chip__img {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>
    </>
  );
};

export default DiscoverCard;
