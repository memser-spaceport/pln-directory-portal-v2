'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { EmblaOptionsType } from 'embla-carousel';
import React from 'react';
import FeaturedHeader from './featured-header';
import IrlCard from './irl-card';
import MemberCard from './member-card';
import TeamCard from './team-card';
import ProjectCard from './project-card';

function renderCard(item: any, isLoggedIn: boolean) {
  const { category } = item;

  switch (category) {
    case 'event':
      return <IrlCard {...item} />;
    case 'member':
      return <MemberCard member={item} isUserLoggedIn={isLoggedIn} />;
    case 'team':
      return <TeamCard {...item} />;
    case 'project':
      return <ProjectCard {...item} />;
    default:
      return null;
  }
}

const Featured = (props: any) => {
  const featuredData = props?.featuredData ?? [];
  const isLoggedIn = props?.isLoggedIn;

  const options: EmblaOptionsType = { slidesToScroll: 'auto', loop: true, align: 'start' };
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const cauroselActions = usePrevNextButtons(emblaApi);

  return (
    <>
      <div className="featured">
        <FeaturedHeader {...cauroselActions} />
        <div className="embla" ref={emblaRef}>
          <div className="featured__body embla__container">
            {featuredData?.map((item: any, index: number) => (
              <div key={`${item.category}-${index}`} className="embla__slide">
                {renderCard(item, isLoggedIn)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .embla {
          overflow: hidden;
          padding: 20px 5px;
        }

        .embla__container {
          display: flex;
        }

        .embla__slide {
          flex: 0 0 289px;
          min-width: 0;
          margin-inline-end: 12px;
          cursor: pointer;
        }

        .featured {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default Featured;
