'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { EmblaOptionsType } from 'embla-carousel';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import DiscoverCard from './discover-card';
import DiscoverHuskyCard from './discover-husky-card';
import { formatDiscoverData } from '@/utils/home.utils';

const Discover = (props: any) => {
  const discoverData = props?.discoverData;
  const formattedDiscoverData = formatDiscoverData(discoverData);

  const options: EmblaOptionsType = {};
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const { onPrevButtonClick, onNextButtonClick, prevBtnDisabled, nextBtnDisabled } = usePrevNextButtons(emblaApi);

  return (
    <>
      <div className="discover">
        {/* Header */}
        <div className="discover__hdr">
          <div className="discover__hdr__ttl">
            <img height={28} width={28} src="icons/discover.svg" alt="discover" />
            <h3 className="discover__hdr__ttl__txt">Discover</h3>
          </div>
          <p className="discover__hdr__desc">
            Explore the Protocol Labs network with <a className="discover__hdr__desc__husky">HuskyAI</a>
          </p>
        </div>
        {/* Carousel */}
        <div className="embla">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="discover__body embla__container">
              <div className="discover__body__sec embla__slide">
                {formattedDiscoverData.slice(0, 3).map((data, index) => {
                  return (
                    <>
                      {data.type !== 'discoverhusky' && (
                        <div key={`discover-card-${data.uid}`} className="discover__body__sec__child1">
                          <DiscoverCard data={data} />
                        </div>
                      )}
                      {data.type === 'discoverhusky' && (
                        <div key={`discover-husky`} className="discover__body__sec2__child1">
                          <DiscoverHuskyCard />
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
              <div className="discover__body__sec2 embla__slide">
                {formattedDiscoverData.slice(3, 6).map((data, index) => {
                  return (
                    <>
                      {data.type !== 'discoverhusky' && (
                        <div key={`discover-card-${data.uid}`} className="discover__body__sec2__child1">
                          <DiscoverCard data={data} />
                        </div>
                      )}
                      {data.type === 'discoverhusky' && (
                        <div key={`discover-husky`} className="discover__body__sec2__child1">
                          <DiscoverHuskyCard />
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="discover__ftr">
          <div className="discover__ftr__actions">
            <button
              className={`discover__ftr__actions__left ${prevBtnDisabled ? 'disabled' : ''}`}
              onClick={() => {
                onPrevButtonClick();
              }}
            >
              <img className="discover__ftr__actions__left__img" src={prevBtnDisabled ? '/icons/left-arrow-circle-disabled.svg' : '/icons/left-arrow-circle.svg'} alt="left arrow" />
            </button>
            <button
              className={`discover__ftr__actions__right ${nextBtnDisabled ? 'disabled' : ''}`}
              onClick={() => {
                onNextButtonClick();
              }}
            >
              <img className="discover__ftr__actions__right__img" src={nextBtnDisabled ? '/icons/right-arrow-circle-disabled.svg' : '/icons/right-arrow-circle.svg'} alt="right arrow" />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .embla__viewport {
          overflow: hidden;
        }

        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          cursor: pointer;
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
          gap: 8px;
        }

        .discover__hdr__ttl__txt {
          font-size: 32px;
          font-weight: 500;
          line-height: 28px;
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
        }

        .discover__body {
          display: flex;
          gap: 14px;
        }

        .discover__body__sec {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .discover__body__sec2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .discover__body__sec__child1:nth-child(1) {
          grid-column: span 1 / span 1;
        }

        .discover__body__sec__child1:nth-child(2) {
          grid-column: span 1 / span 1;
        }

        .discover__body__sec__child1:nth-child(3) {
          grid-column: span 2 / span 2;
        }

        .discover__body__sec2__child1:nth-child(1) {
          grid-column: span 2 / span 2;
        }

        .discover__body__sec2__child1:nth-child(2) {
          grid-column: span 1 / span 1;
        }

        .discover__body__sec2__child1:nth-child(3) {
          grid-column: span 1 / span 1;
        }

        .discover__body__sec__child1 {
          height: 190px;
        }

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
            -webkit-line-clamp: 7;
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
        }
      `}</style>
    </>
  );
};

export default Discover;