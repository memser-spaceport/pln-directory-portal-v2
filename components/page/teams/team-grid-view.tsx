'use client';

import { ITag, ITeam } from '@/types/teams.types';
import TeamsTagsList from './teams-tags-list';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import { EmblaOptionsType } from 'embla-carousel';
import { Fragment, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import  Popover from './asks-popover';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Tag } from '@/components/ui/tag';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useCarousel } from '@/hooks/use-embla-carousel';
interface ITeamGridView {
  team: ITeam;
  viewType: string;
}
const TeamGridView = (props: ITeamGridView) => {
  const team = props?.team;
  const profile = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];
  const analytics = useTeamAnalytics();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const carousel: any[] = team?.asks?.map((ask: any) => {
    return {
      id: ask?.uid,
      name: ask?.title,
      description: ask?.description,
      tags: ask?.tags,
    };
  }) ?? [];

  const { emblaRef, activeIndex, scrollPrev, scrollNext, setActiveIndex, emblaApi } = useCarousel({
    slidesToScroll: "auto",
    loop: true,
    align: "start",
    containScroll: "trimSnaps",
    isPaused: isTooltipOpen,
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
  }

  return (
    <>
      <div className="team-grid">
        <div className="team-grid__profile-container">
          <Image alt='profile' height={72} width={72} layout='intrinsic' loading='eager' priority={true} className="team-grid__profile-container__profile" src={profile} />
        </div>
        <div className="team-grid__details-container">
          <div className="team-grid__details-container__team-detail">
            <h2 className="team-grid__details-container__team-detail__team-name">{teamName}</h2>
            <p className="team-grid__details-container__team-detail__team-desc">{description}</p>
          </div>

          <div>
            <div className="team-grid__tags__desc">
              <TeamsTagsList tags={tags} noOfTagsToShow={3} />
            </div>
            <div className="team-grid__tags__mob">
              <TeamsTagsList tags={tags} noOfTagsToShow={1} />
            </div>
          </div>
        </div>
        {
          carousel.length > 0 &&
          <div className="embla" onClick={handleClick}>
            <div className="embla__viewport" ref={emblaRef}>
              <div className="embla__container">
                {carousel.map((item, index) => (
                  <div key={item.id} className="embla__slide__cntr">
                    <div
                      className={`embla__slide ${index === activeIndex ? "active" : ""}`}
                    >
                      <Image
                        alt="left"
                        height={15}
                        width={15}
                        src="/icons/tabler_message-filled.svg"
                        className="embla__img"
                      />
                      <div className='hide-tooltip'>
                        <Popover
                          name={item.name}
                          description={item.description}
                          tags={item.tags}
                          onOpenChange={(isOpen) => setIsTooltipOpen(isOpen)}
                        />
                      </div>
                      <div className='hide-name'>
                        {item.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dash Buttons */}
              {carousel.length > 1 &&
                <div className="embla__dashes">
                  {carousel.map((_, index) => (
                    <button
                      key={index}
                      className={`embla__dash ${index === activeIndex ? "highlighted" : ""
                        }`}
                      onClick={() => {
                        setActiveIndex(index);
                        emblaApi?.scrollTo(index); 
                        analytics.onCarouselButtonClicked();
                      }}
                    >
                    </button>
                  ))}
                </div>
              }
            </div>

            {carousel.length > 1 &&
              <>
                <button className="embla__button embla__button--prev" onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); scrollPrev(); analytics.onCarouselPrevButtonClicked();}}>
                  <Image alt='left' height={12} width={12} src='/icons/arrow-left-blue.svg' />
                </button>
                <button className="embla__button embla__button--next" onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); scrollNext(); analytics.onCarouselNextButtonClicked();}}>
                  <Image alt='right' height={12} width={12} src='/icons/arrow-right-blue.svg' />
                </button>
              </>
            }
          </div>
        }
      </div>
      <style jsx>
        {`
           .embla {
            position: relative;
            overflow: hidden;
            width: 100%;
            display: flex;
            height: 24px;
            border-top: 0.4px solid #93C5FD;
            background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.15) 8.43%, rgba(68, 213, 187, 0.15) 87.45%);
            border-radius: 0px 0px 12px 12px;
          }
            
          .tooltip {
            height: 206px;
            width: 304px;
            background-color: #fff;
            overflow: unset;
            padding: 12px ;
            gap: 10px;
            border-radius: 12px;
            border: 1px ;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
            padding: 8px;
          }

          .hoverable-name:hover {
            text-decoration: underline;
            cursor: pointer;
          }
          .hoverable-name {
            display: flex;
          }

          .embla__dashes {
            display: flex;
            justify-content: center;
            position: relative;
            bottom: 6px;
            gap: 2px;
          }

          .embla__dash {
            background: #93C5FD;
            border: none;
            color: #93C5FD;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            transition: color 0.3s;
            width: 9px;
            height: 3px;
          }

          .embla__dash.highlighted {
            color: #156FF7 !important;
            background: #156FF7;
            font-weight: bold;
          }

          .embla__viewport {
            overflow: hidden;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: ${carousel.length < 2 ? "space-around" : "unset"};
          }
                  
          .embla__container {
            display: flex;
            flex-direction: row;
            width: 100%;
          }
                  
          .embla__slide__cntr {
            min-width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 11px;
            font-weight: 400;
            line-height: 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .embla__img {
            display: flex;
            align-items: center;
          }

          .embla__button-carousel {
            position: relative;
            bottom: 8px;
          }

          .embla__slide {
            display: flex;
            flex-direction: row;
            gap: 4px;
            align-items: baseline;
            justify-content: center;
            padding: 0 20px;
            position: relative;
          }

          .embla__container__cnt {
            display: flex;
            flex-direction: row;
            gap: 8px;
            width: 100px;
            position: relative;
            overflow: hidden;
          }
                  
          .embla__button {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1;
          }
                  
          .embla__button--prev {
            left: 10px;
            background: transparent;
          }
                  
          .embla__button--next {
            right: 10px;
            background: transparent;
          }


          .team-grid {
            width: 167.5px;
            height: 168px;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-grid:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid__profile-container {
            position: relative;
            height: 33px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .team-grid__details-container {
            padding: ${carousel.length > 0 ? " 0 12px 7px 12px" : "0 12px 12px 12px"};
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: ${carousel.length > 0 ? "4px" : "6px"};
            text-align: center;
          }

          .team-grid__details-container__team-detail {
            display: flex;
            flex-direction: column;
          }

          .team-grid__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            line-height: 22px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            height:  ${carousel.length > 0 ? "36px" : "54px"};
            display: -webkit-box;
            -webkit-line-clamp: ${carousel.length > 0 ? "2" : "3"};
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__tagscontainer {
            display: flex;
            gap: 8px;
            height: 26px;
          }

          .team-grid__tags__mob {
            display: block;
          }
          .team-grid__tags__desc {
            display: none;
          }

          .embla__button--prev, .embla__button--next {
            display: none;
          }

          .hide-tooltip {
            display: none;
          }

          .hide-name {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 110px; 
            position: relative;
            bottom: 3px;
          }

          @media (min-width: 1024px) {
            .embla__button--prev, .embla__button--next {
              display: flex;
            }

            .hide-tooltip {
              display: flex;
            }

            .hide-name {
              display: none;
            }

            .embla__dashes {
              top: 2px;
            }

           .embla {
              height: 36px;
            }

            .embla__slide__cntr {
              font-size: 13px;
              align-items: center;
            }
            .embla__slide {
              align-items: center;
            }
            .team-grid__details-container__tagscontainer {
              margin-left: 0;
            }

            .team-grid {
              width: 289px;
              height: 267px;
            }

            .team-grid__details-container__team-detail__team-name {
              font-size: 18px;
              line-height: 28px;
            }

            .team-grid__profile-container {
              height: 64px;
            }

            .team-grid__details-container {
              padding: ${carousel.length > 0 ? "0 20px 0px 20px" : "0 20px 20px 20px"};
              margin-top: 38px;
              margin-bottom: ${carousel.length > 0 ? "7px" : ""};
              gap: ${carousel.length > 0 ? "0px" : "10px"};
            }

            .team-grid__details-container__team-detail {
              gap: ${carousel.length > 0 ? "3px" : "10px"};
              border-bottom: ${carousel.length > 0 ? "unset" : "1px solid #e2e8f0"};
            }

            .team-grid__details-container__team-detail__team-desc {
              font-size: 14px;
              height: 60px;
              line-height: 20px;
              margin-bottom: ${carousel.length > 0 ? "5px" : "10px"};
            }

            .team-grid__tags__mob {
              display: none;
            }
            .team-grid__tags__desc {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamGridView;
