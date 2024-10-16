'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { EmblaOptionsType } from 'embla-carousel';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import DiscoverCard from './discover-card';
import DiscoverHuskyCard from './discover-husky-card';
import { formatDiscoverData } from '@/utils/home.utils';
import { Fragment } from 'react';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

const Discover = (props: any) => {
  const discoverData = props?.discoverData;
  const formattedDiscoverData = formatDiscoverData(discoverData);
  const userInfo = props?.userInfo;

  const analytics = useHomeAnalytics();
  const options: EmblaOptionsType = {};
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const { onPrevButtonClick, onNextButtonClick, prevBtnDisabled, nextBtnDisabled } = usePrevNextButtons(emblaApi);

  const onHuskyClick = () => {
    analytics.onDiscoverHuskyClicked({ from: 'home page' }, getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent('open-husky-dialog'));
  };

  const renderCard = (data: any) => {
    const isHusky = data.type === 'discoverhusky';

    if (isHusky) {
      return <DiscoverHuskyCard userInfo={userInfo} />;
    }

    return <DiscoverCard data={data} userInfo={userInfo} />;
  };

  return (
    <>
      <section className="discover">
        {/* Header */}
        <header className="discover__hdr">
          <div className="discover__hdr__ttl">
            <img className="discover__hdr__ttl__img" src="icons/discover.svg" alt="discover" />
            <h2 className="discover__hdr__ttl__txt">Discover</h2>
          </div>
          <p className="discover__hdr__desc">
            Explore Protocol Labs with{' '}
            <button aria-label="Explore with Husky" onClick={onHuskyClick} className="discover__hdr__desc__husky">
              Husky
            </button>
          </p>
        </header>
        {/* Carousel */}
        <div className="embla" aria-label="Discover carousel">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="discover__body embla__container">
              <div className="discover__body__sec embla__slide">
                {formattedDiscoverData.slice(0, 3).map((data) => {
                  return (
                    <Fragment key={`section-one-discover-card-${data.uid}`}>
                      <div className="discover__body__sec__child1">{renderCard(data)}</div>
                    </Fragment>
                  );
                })}
              </div>
              <div className="discover__body__sec2 embla__slide">
                {formattedDiscoverData.slice(3, 5).map((data) => {
                  return (
                    <div key={`section-two-discover-card-${data.uid}`} className="discover__body__sec2__child1">
                      {renderCard(data)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="discover__ftr">
          <div className="discover__ftr__actions" aria-label="Carousel navigation">
            <button
              data-testid="prev-button"
              className={`discover__ftr__actions__left ${prevBtnDisabled ? 'disabled' : ''}`}
              onClick={() => {
                analytics.onDiscoverCarouselActionsClicked(getAnalyticsUserInfo(userInfo));
                onPrevButtonClick();
              }}
              aria-label="Previous slide"
              disabled={prevBtnDisabled}
            >
              <img className="discover__ftr__actions__left__img" src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'} alt="left arrow" />
            </button>
            <button
              data-testid="next-button"
              className={`discover__ftr__actions__right ${nextBtnDisabled ? 'disabled' : ''}`}
              onClick={() => {
                analytics.onDiscoverCarouselActionsClicked(getAnalyticsUserInfo(userInfo));
                onNextButtonClick();
              }}
              aria-label="Next slide"
              disabled={nextBtnDisabled}
            >
              <img className="discover__ftr__actions__right__img" src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'} alt="right arrow" />
            </button>
          </div>
        </div>
      </section>
      <style jsx>{`
        .embla__viewport {
          overflow: hidden;
        }

        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          cursor: pointer;
          padding: 2px;
        }

        .embla__container {
          display: flex;
        }

        .discover {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .discover__hdr {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .discover__hdr__ttl {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .discover__hdr__ttl__img {
          height: 16px;
          width: 16px;
        }

        .discover__hdr__ttl__txt {
          font-size: 16px;
          font-weight: 500;
          line-height: 32px;
          color: #0f172a;
        }

        .discover__hdr__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
        }

        .discover__hdr__desc__husky {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #156ff7;
          cursor: pointer;
          background: transparent;
        }

        .discover__body {
          display: flex;
          gap: 12px;
        }

        .discover__body__sec,
        .discover__body__sec2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .discover__body__sec__child1:nth-child(1) {
          grid-column: span 1 / span 1;
        }

        .discover__body__sec__child1:nth-child(3) {
          grid-column: span 2 / span 2;
        }

        .discover__body__sec2__child1:nth-child(1) {
          grid-column: span 2 / span 2;
        }

        .discover__body__sec2__child1:nth-child(2) {
          grid-column: span 2 / span 2;
        }

        .discover__body__sec__child1,
        .discover__body__sec2__child1 {
          height: 190px;
        }

        .discover__ftr__actions {
          display: flex;
          justify-content: center;
          gap: 4px;
        }

        .discover__ftr__actions button {
          background: transparent;
        }

        @media (min-width: 1024px) {
          .discover__body__sec {
            flex: 1;
          }

          .discover__body__sec2 {
            flex: 1;
          }

          .discover__body__sec__child1__qus {
            font-size: 23px;
            line-height: 32px;
          }

          .discover__body__sec__child1 {
            height: 247px;
          }

          .discover__body__sec2__child1 {
            height: 247px;
          }

          .discover__body__sec__child1_chips {
            right: 20px;
            bottom: 20px;
            justify-content: end;
            gap: 8px;
          }

          .discover__ftr {
            display: none;
          }

          .discover__hdr__ttl__txt {
            font-size: 32px;
            line-height: 28px;
          }

          .discover__hdr__ttl__img {
            height: 28px;
            width: 28px;
          }

          .discover__hdr__ttl {
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default Discover;
