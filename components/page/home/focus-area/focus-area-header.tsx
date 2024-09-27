import { useHomeAnalytics } from '@/analytics/home.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { HOME_PAGE_LINKS } from '@/utils/constants';

const FocusAreaHeader = ({
  onPrevButtonClick,
  onNextButtonClick,
  prevBtnDisabled,
  nextBtnDisabled,
  userInfo,
}: {
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  userInfo: IUserInfo;
}) => {
  const protocolVisionUrl = HOME_PAGE_LINKS.FOCUSAREA_PROTOCOL_LABS_VISION_URL as string;

  const analytics = useHomeAnalytics();

  const onProtocolVisionUrlClick = () => {
    analytics.onFocusAreaProtocolLabsVisionUrlClicked(protocolVisionUrl, getAnalyticsUserInfo(userInfo));
  };

  return (
    <>
      <div className="lfa__hdr">
        <div className="lfa__hdr__title">
          <div className="lfa__titlesec">
            <img height={28} width={28} src="/icons/hexagon-wheels.svg" />
            <h2 className="lfa__titles__ttl">Focus Areas</h2>
          </div>
          <div className="lfa__descsec">
            <p className="lfa__descsec__desc">
              <a href={protocolVisionUrl} target="_blank" className="lfa__hdr__desc__link" onClick={onProtocolVisionUrlClick}>
                {' '}
                Protocol Labs’ vision{' '}
              </a>{' '}
              for the future is built on four core focus areas that aim to harness humanity’s potential for good, navigate potential pitfalls, and ensure a future where technology empowers humanity.
            </p>
          </div>
        </div>
        {(!prevBtnDisabled || !nextBtnDisabled) && 
        <div className="lfa__hdr__actions">
          <button
            className={`lfa__hdr__actions__left ${prevBtnDisabled ? 'disabled' : ''}`}
            onClick={() => {
              onPrevButtonClick();
            }}
          >
            <img className="lfa__hdr__actions__left__img" src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'} alt="left arrow" />
          </button>
          <button
            className={`lfa__hdr__actions__right ${nextBtnDisabled ? 'disabled' : ''}`}
            onClick={() => {
              onNextButtonClick();
            }}
          >
            <img className="lfa__hdr__actions__right__img" src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'} alt="right arrow" />
          </button>
        </div>}
      </div>
      <style jsx>{`
        .lfa__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lfa__hdr__title {
          display: flex;
          flex-direction: column;
          max-width: 80%;
          gap: 12px;
        }

        .lfa__titlesec {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lfa__hdr__desc__link {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #156ff7;
          cursor: pointer;
        }

        .lfa__descsec__desc {
          color: #64748b;
          font-size: 14px;
          line-height: 24px;
          font-weight: 400;
        }

        .lfa__titles__ttl {
          font-size: 32px;
          line-height: 28px;
          font-weight: 500;
        }

        .lfa__hdr__actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .lfa__hdr__actions button {
          background: transparent;
        }

        .disabled {
          pointer-events: none;
        }

        .lfa__hdr__actions__left:hover .featured__hdr__actions__left__img {
          content: url('/icons/left-arrow-circle-blue.svg');
        }

        .lfa__hdr__actions__right:hover .featured__hdr__actions__right__img {
          content: url('/icons/right-arrow-circle-blue.svg');
        }
      }
      `}</style>
    </>
  );
};

export default FocusAreaHeader;
