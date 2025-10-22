'use client';

import { ITag, ITeam } from '@/types/teams.types';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '../../core/tooltip/tooltip';
import { Tag } from '../../ui/tag';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { EmblaOptionsType } from 'embla-carousel';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import Popover from './asks-popover';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useCarousel } from '@/hooks/use-embla-carousel';
interface ITeamListView {
  team: ITeam;
  viewType: string;
}
const TeamListView = (props: ITeamListView) => {
  const team = props?.team;
  const viewType = props?.viewType;
  const profile = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];
  const analytics = useTeamAnalytics();
  const [activeIndexMob, setActiveIndexMob] = useState<number>(0);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // todo - remove ASKS completely as we move to forum
  // const carousel: any[] =
  //   team?.asks
  //     ?.filter((ask) => ask.status !== 'CLOSED')
  //     .map((ask: any) => {
  //       return {
  //         id: ask?.uid,
  //         name: ask?.title,
  //         description: ask?.description,
  //         tags: ask?.tags,
  //       };
  //     }) ?? [];
  const carousel: any[] = [];

  const { emblaRef, activeIndex, scrollPrev, scrollNext, setActiveIndex, emblaApi } = useCarousel({
    slidesToScroll: 'auto',
    loop: true,
    align: 'start',
    containScroll: 'trimSnaps',
    isPaused: isTooltipOpen,
  });

  const AUTO_SCROLL_INTERVAL = 10000;

  const options: EmblaOptionsType = { slidesToScroll: 'auto', loop: true, align: 'start', containScroll: 'trimSnaps' };
  const [emblaRefMob, emblaApiMob] = useEmblaCarousel(options);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const scrollPrevMob = useCallback(() => {
    if (emblaApiMob) {
      emblaApiMob.scrollPrev();
      const index = emblaApiMob.selectedScrollSnap();
      setActiveIndexMob(index);
    }
  }, [emblaApiMob]);

  const scrollNextMob = useCallback(() => {
    if (emblaApiMob) {
      emblaApiMob.scrollNext();
      const index = emblaApiMob.selectedScrollSnap();
      setActiveIndexMob(index);
    }
  }, [emblaApiMob]);

  useEffect(() => {
    if (!emblaApiMob) return;

    const updateActiveIndex = () => {
      const index = emblaApiMob.selectedScrollSnap();
      setActiveIndexMob(index);
    };

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (emblaApiMob) {
          if (emblaApiMob.canScrollNext()) {
            emblaApiMob.scrollNext();
          } else {
            emblaApiMob.scrollTo(0);
          }
          updateActiveIndex();
        }
      }, AUTO_SCROLL_INTERVAL);
    };

    const stopAutoScroll = () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
    startAutoScroll();
    emblaApiMob.on('select', updateActiveIndex);

    return () => {
      stopAutoScroll();
      emblaApiMob.off('select', updateActiveIndex);
    };
  }, [emblaApiMob]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <div className="team-list">
        <div className="team-list__Cntr">
          <div className="team-list__profile-container">
            <Image
              alt="profile"
              loading="eager"
              height={72}
              width={72}
              layout="intrinsic"
              priority={true}
              className="team-list__profile-container__profile"
              src={profile}
            />
          </div>
          <div className="team-list__details-container">
            <div className="team-list__details-container__team-detail">
              <h2 className="team-list__details-container__team-detail__team-name">{teamName}</h2>
              <p className="team-list__details-container__team-detail__team-desc">{description}</p>
              <div className="team-list__details-container__team-detail__team-carousel">
                {carousel.length > 0 && (
                  <div className="embla__wrapper" onClick={handleClick}>
                    {carousel.length > 1 && (
                      <div className="embla__controls">
                        <button
                          className="embla__button embla__button--prev"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            e.preventDefault();
                            scrollPrev();
                            analytics.onCarouselPrevButtonClicked();
                          }}
                        >
                          <Image alt="left" height={12} width={12} src="/icons/arrow-left-blue.svg" />
                        </button>
                        <div className="embla__dashes__list">
                          {carousel.map((_, index) => (
                            <button
                              key={index}
                              className={`embla__dash__list ${index === activeIndex ? 'highlighted' : ''}`}
                              onClick={() => {
                                setActiveIndex(index);
                                emblaApi?.scrollTo(index);
                                analytics.onCarouselButtonClicked();
                              }}
                            ></button>
                          ))}
                        </div>
                        <button
                          className="embla__button embla__button--next"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            e.preventDefault();
                            scrollNext();
                            analytics.onCarouselNextButtonClicked();
                          }}
                        >
                          <Image alt="right" height={12} width={12} src="/icons/arrow-right-blue.svg" />
                        </button>
                      </div>
                    )}

                    {/* Carousel Content */}
                    <div className="embla__viewport__list" ref={emblaRef}>
                      <div className="embla__container">
                        {carousel.map((item, index) => (
                          <div key={item.id} className="embla__slide__cntr__list">
                            <div className={`embla__slide__list ${index === activeIndex ? 'active' : ''}`}>
                              <Image
                                alt="left"
                                height={15}
                                width={15}
                                src="/icons/tabler_message-filled.svg"
                                className="embla__img"
                              />
                              <div className="hide-tooltip">
                                <Popover
                                  name={item.name}
                                  description={item.description}
                                  tags={item.tags}
                                  onOpenChange={(isOpen) => setIsTooltipOpen(isOpen)}
                                />
                              </div>
                              <div className="hide-name">{item.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="team-list__details-container__tagscontainer team-list__details-container__tagscontainer">
              {tags?.map((tag: ITag, index: number) => (
                <Fragment key={`${tag} + ${index}`}>
                  {index < 3 && (
                    <div>
                      {
                        <Tooltip
                          asChild
                          trigger={
                            <div>
                              <Tag value={tag?.title} variant="primary" tagsLength={tags?.length} />{' '}
                            </div>
                          }
                          content={tag?.title}
                        />
                      }
                    </div>
                  )}
                </Fragment>
              ))}
              {tags?.length > 3 && (
                <Tooltip
                  asChild
                  trigger={
                    <div>
                      <Tag variant="primary" value={'+' + (tags?.length - 3).toString()}></Tag>
                    </div>
                  }
                  content={
                    <div>
                      {tags?.slice(3, tags?.length).map((tag, index) => (
                        <div key={`${tag} + ${tag} + ${index}`}>
                          {tag?.title}
                          {index !== tags?.slice(3, tags?.length - 1)?.length ? ',' : ''}
                        </div>
                      ))}
                    </div>
                  }
                />
              )}
            </div>
          </div>
        </div>
        <div className="carousel__container">
          {carousel.length > 0 && (
            <div className="embla" onClick={handleClick}>
              <div className="embla__viewport" ref={emblaRefMob}>
                <div className="embla__container">
                  {carousel.map((item, index) => (
                    <div key={item.id} className="embla__slide__cntr">
                      <div className={`embla__slide ${index === activeIndexMob ? 'active' : ''}`}>
                        <Image
                          alt="left"
                          height={15}
                          width={15}
                          src="/icons/tabler_message-filled.svg"
                          className="embla__img"
                        />
                        <div className="hide-tooltip">
                          <Popover name={item.name} description={item.description} tags={item.tags} />
                        </div>
                        <div className="hide-name">{item.name}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dash Buttons */}
                {carousel.length > 1 && (
                  <div className="embla__dashes">
                    {carousel.map((_, index) => (
                      <button
                        key={index}
                        className={`embla__dash ${index === activeIndexMob ? 'highlighted' : ''}`}
                        onClick={() => {
                          setActiveIndexMob(index);
                          emblaApiMob?.scrollTo(index);
                          analytics.onCarouselButtonClicked();
                        }}
                      ></button>
                    ))}
                  </div>
                )}
              </div>

              {carousel.length > 1 && (
                <>
                  <button
                    className="embla__button embla__button--prev"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault();
                      scrollPrevMob();
                    }}
                  >
                    <Image alt="left" height={12} width={12} src="/icons/arrow-left-blue.svg" />
                  </button>
                  <button
                    className="embla__button embla__button--next"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      e.preventDefault();
                      scrollNextMob();
                    }}
                  >
                    <Image alt="right" height={12} width={12} src="/icons/arrow-right-blue.svg" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .team-list {
            background-color: #fff;
            display: flex;
            border-radius: 12px;
            width: inherit;
            padding: ${carousel.length > 0 ? 'unset' : '20px'};
            gap: ${carousel.length > 0 ? 'unset' : '8px'};
            border: ${carousel.length > 0 ? 'unset' : '1px solid #fff'};
            box-shadow:
              0px 4px 4px 0px rgba(15, 23, 42, 0.04),
              0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            flex-direction: ${carousel.length > 0 ? 'column' : 'row'};
          }

          .team-list__Cntr {
            display: flex;
            flex-direction: row;
            padding: ${carousel.length > 0 ? '20px 20px 20px 20px' : 'unset'};
            border: ${carousel.length > 0 ? '1px solid #fff' : 'unset'};
            gap: 8px;
            border-radius: 12px;
          }

          .team-list:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-list:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-list__details-container {
            align-items: center;
            text-align: left;
            display: grid;
            width: 100%;
            gap: 16px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }

          .team-list__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            padding-top: 4px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-list__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 5px;
            margin-left: -39px;
          }

          .team-list__details-container__tagscontainer {
            display: flex;
            gap: 8px;
            height: 26px;
            margin-left: -37px;
          }

          .embla {
            position: relative;
            overflow: hidden;
            width: 100%;
            display: flex;
            height: 30px;
            background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.15) 8.43%, rgba(68, 213, 187, 0.15) 87.45%);
            border-radius: 0 0 12px 12px;
            padding: 0px 16px;
          }

          .embla__wrapper {
            position: relative;
            overflow: hidden;
            width: 100%;
            display: flex;
            height: 30px;
            width: 300px;
            background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.15) 8.43%, rgba(68, 213, 187, 0.15) 87.45%);
            border-radius: 4px;
          }

          .tooltip {
            height: 206px;
            width: 304px;
            background-color: #fff;
            overflow: unset;
            padding: 12px;
            gap: 10px;
            border-radius: 12px;
            border: 1px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
            padding: 8px;
          }

          .team-list__details-container__team-detail__team-carousel {
            display: none;
          }

          .embla__dashes {
            display: flex;
            justify-content: center;
            position: relative;
            bottom: 1px;
            gap: 2px;
          }

          .embla__dashes__list {
            display: flex;
            justify-content: center;
            position: relative;
            bottom: unset;
            gap: 4px;
            left: 11px;
            align-items: center;
            padding: 12px 0px;
            left: 25px;
          }

          .embla__dash {
            background: #93c5fd;
            border: none;
            color: #93c5fd;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            transition: color 0.3s;
            width: 9px;
            height: 3px;
            border-radius: 30px;
          }

          .embla__dash__list {
            background: #93c5fd;
            border: none;
            color: #93c5fd;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            transition: color 0.3s;
            width: 4px;
            height: 4px;
            border-radius: 50px;
          }

          .embla__dash.highlighted {
            color: #156ff7;
            background: #156ff7;
            font-weight: bold;
          }

          .embla__viewport {
            overflow: hidden;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: ${carousel.length < 2 ? 'center' : 'unset'};
          }

          .embla__viewport__list {
            overflow: hidden;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: left;
            position: relative;
            left: ${carousel.length < 2 ? '20px' : '45px'};
            justify-content: center;
          }

          .embla__container {
            display: flex;
            flex-direction: row;
          }

          .embla__container__actions {
            display: flex;
            flex-direction: row;
            align-items: center;
          }

          .embla__slide__cntr,
          .embla__slide__cntr__list {
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
            align-items: center;
            justify-content: center;
            padding: 0 20px;
            position: relative;
          }

          .embla__slide__list {
            display: flex;
            flex-direction: row;
            gap: 4px;
            align-items: center;
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
            left: ${carousel.length < 3 ? '40px' : '48px'};
            background: transparent;
          }

          .embla__button--prev,
          .embla__button--next {
            display: none;
          }

          .hide-tooltip {
            display: none;
          }

          .hide-name {
            display: block;
            position: relative;
          }

          .embla__wrapper {
            position: relative;
          }

          .embla__viewport {
            overflow: hidden;
            width: 100%;
          }

          .embla__container {
            display: flex;
            flex-direction: row;
          }

          .embla__controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 3;
          }

          .embla__dash__list.highlighted {
            background: #156ff7;
          }

          @media (min-width: 1024px) {
            .carousel__container {
              display: none;
            }

            .team-list__details-container__team-detail__team-carousel {
              display: flex;
            }

            .team-list__Cntr {
              padding: ${carousel.length > 0 ? '20px 20px 45px 20px' : 'unset'};
            }

            .embla__button--prev,
            .embla__button--next {
              display: flex;
            }

            .hide-tooltip {
              display: flex;
            }

            .hide-name {
              display: none;
            }

            .embla__dashes {
              top: 3px;
            }

            .embla {
              height: 36px;
            }

            .embla__slide__cntr {
              font-size: 13px;
              align-items: center;
            }

            .embla__slide__cntr__list {
              font-size: 13px;
              align-items: center;
              place-items: flex-start;
            }
            .embla__slide {
              align-items: center;
            }

            .team-list__details-container {
              gap: 20px;
              max-height: 72px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .team-list {
              gap: 16px;
            }

            .team-list__details-container__team-detail {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .team-list__details-container__team-detail__team-name {
              padding-top: 0px;
            }

            .team-list-container__team-detail__team-name {
              padding-top: 0;
            }

            .team-list__details-container__team-detail__team-desc {
              margin-top: 0;
              margin-left: 0;
            }

            .team-list__details-container__tagscontainer {
              justify-content: end;
              flex-wrap: wrap;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamListView;
