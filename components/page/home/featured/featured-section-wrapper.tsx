'use client';

import { getFeaturedData } from '@/services/home.service';
import useEmblaCarousel from 'embla-carousel-react';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { EmblaOptionsType } from 'embla-carousel';
import FeaturedSection from './featured-section';

const FeaturedWrapper = (props: any) => {
  const options: EmblaOptionsType = { slidesToScroll: 'auto', loop: true };

  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi);

  return (
    <>
      <div className="featured">
        <div className="featured__hdr">
          <div className="featured__ttl">
            <img src="/icons/featured.svg" alt="featured" height={28} width={28} />
            <h3 className="featured__ttl__txt">Featured</h3>
          </div>
          <div className="featured__hdr__actions">
            <button onClick={onPrevButtonClick}>
              <img src="/icons/left-arrow-circle.svg" />
            </button>
            <button onClick={onNextButtonClick}>
              <img src="/icons/right-arrow-circle.svg" />
            </button>
          </div>
        </div>
        <div className="embla" ref={emblaRef}>
          <div className="featured__body embla__container">
            {/* {React.Children.map(children, (child) => (
            <div className="embla__slide">{child}</div>
          ))} */}
          </div>
        </div>
      </div>
      <style jsx>{`
        .embla {
          overflow: hidden;
        }

        .embla__container {
          display: flex;
          padding-block: 20px;
        }

        .embla__slide {
          flex: 0 0 289px;
          min-width: 0;
          margin-left: 12px;
        }

        .featured {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .featured__hdr {
          display: flex;
          justify-content: space-between;
        }

        .featured__hdr__actions {
          display: flex;
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
      `}</style>
    </>
  );
};

export default FeaturedWrapper;
