'use client';
import useEmblaCarousel from 'embla-carousel-react';
import React, { useCallback, useEffect, useState } from 'react';
import { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { usePrevNextButtons } from '@/hooks/use-prev-next-buttons';
import FocusAreaHeader from './focus-area-header';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo, getAnalyticsFocusAreaInfo } from '@/utils/common.utils';
import { IFocusArea } from '@/types/shared.types';
import { HOME, HOME_PAGE_LINKS } from '@/utils/constants';
import FocusAreaDialog from './focus-area-dialog';

const LandingFocusAreas = (props: any) => {
  const analytics = useHomeAnalytics();
  const focusAreas = props?.focusAreas;
  const userInfo = props.userInfo;
  const options: EmblaOptionsType = { align: 'start' };
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const cauroselActions = usePrevNextButtons(emblaApi);
  const [mb_emblaRef, mb_emblaApi] = useEmblaCarousel(options);
  const [scrollProgress, setScrollProgress] = useState(0);
  const onScroll = useCallback((mb_emblaApi: EmblaCarouselType) => {
    const progress = Math.max(0, Math.min(1, mb_emblaApi.scrollProgress()))
    setScrollProgress(progress * 100)
  }, []);

  const protocolVisionUrl = HOME_PAGE_LINKS.FOCUSAREA_PROTOCOL_LABS_VISION_URL as string;

  useEffect(() => {
    if (!mb_emblaApi) return
    onScroll(mb_emblaApi)
    mb_emblaApi
      .on('reInit', onScroll)
      .on('scroll', onScroll)
      .on('slideFocus', onScroll)
  }, [mb_emblaApi, onScroll])

  const routeTo = (focusArea: IFocusArea, type: string) => {
    if (type === 'Team') {
      window.open(`/teams?focusAreas=${focusArea.title}`, '_blank');
      analytics.onFocusAreaTeamsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
    } else {
      window.open(`/projects?focusAreas=${focusArea.title}`, '_blank');
      analytics.onFocusAreaProjectsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
    }
  }

  const onClickSeeMore = (focusArea:any) => {
    document.dispatchEvent(
      new CustomEvent(HOME.TRIGGER_FOCUS_AREA_DIALOG, {
        detail: {
          focusArea
        },
      })
    );
  }

  const onProtocolVisionUrlClick = () => {
    analytics.onFocusAreaProtocolLabsVisionUrlClicked(protocolVisionUrl, getAnalyticsUserInfo(userInfo));
  };

  return (
    <>
      <div className="lfa">
        <FocusAreaHeader userInfo={userInfo} {...cauroselActions}/>
        <div className="embla" ref={emblaRef}>
          <div className="lfa__focusareas embla__container">
            { 
              focusAreas?.teamFocusAreas.map((focusArea: any, index: number) => {
              const image = `/icons/${focusArea?.title?.toLowerCase()}.svg`;
              const teamAncestorFocusAreas = focusArea?.teamAncestorFocusAreas;
              const projectAncestorFocusAreas = focusAreas?.projectFocusAreas?.find((projectFocusArea: any) => {
                  return projectFocusArea.title === focusArea.title
              })?.projectAncestorFocusAreas;
              return (
                <div className="lfa__focusareas__focusarea embla__slide" key={`focusArea-${index}`}>
                  <div className="lfa__focusareas__focusarea__header">
                    <h2 className="lfa__focusareas__focusarea__header__title">{focusArea?.title}</h2>
                    <div className="lfa__focusareas__focusarea__headers__desc">
                      { 
                        focusArea?.description?.length < 140 ? focusArea?.description : 
                          <div> {
                            focusArea?.description?.slice(0, 140)+"..."}
                            <span className="lfa__focusarea__desc_seemore" onClick={()=>{
                               onClickSeeMore({...focusArea, projectAncestorFocusAreas });
                            }}>see more</span>
                        </div>
                      }
                    </div>
                  </div>
                  <div className="lfa__focusareas__focusarea__footer">
                    {teamAncestorFocusAreas?.length > 0 && <div onClick={()=> {routeTo(focusArea, "Team")}} className="lfa__focusareas__focusarea__footer__tms">
                      <div className='focusareas__focusarea__footer__info'>
                        <span className="lfa__focusareas__focusarea__footer__count"> {teamAncestorFocusAreas?.length || 0}</span>
                        <span className="lfa__focusareas__focusarea__footer__txt">Teams</span>
                      </div>
                      <div className="lfa__focusareas__focusarea__avartars__cnt">
                        <div className="lfa__focusareas__focusarea__avatars">
                          {
                            teamAncestorFocusAreas?.map((teamAncestorFocusArea: any, index: number) => {
                            if (index < 3) {
                                return <img 
                                  title="Team"
                                  key={teamAncestorFocusArea?.team?.uid}
                                  width={24}
                                  height={24}
                                  src={teamAncestorFocusArea?.team?.logo?.url || '/icons/team-default-profile.svg'}
                                  alt="team"
                                  className="lfa__focusareas__focusarea__avatar"
                                />;
                            }
                            })
                          }
                        </div>
                        { teamAncestorFocusAreas?.length > 0 && <img src={"/icons/arrow-blue-right.svg"} alt='project'/> }
                      </div>
                    </div>
                    }
                    {projectAncestorFocusAreas?.length > 0 &&
                      <div onClick={()=> {routeTo(focusArea, "Project")}} className="lfa__focusareas__focusarea__footer__prts">
                        <div className='focusareas__focusarea__footer__info'>
                          <span className="lfa__focusareas__focusarea__footer__count"> {projectAncestorFocusAreas?.length} </span> 
                          <span className="lfa__focusareas__focusarea__footer__txt">Projects</span>
                        </div>
                        <div className="lfa__focusareas__focusarea__avartars__cnt">
                        <div className="lfa__focusareas__focusarea__avatars">
                          {projectAncestorFocusAreas?.map((projectAncestorFocusArea: any, index: number) => {
                            if (index < 3) {
                                return <img 
                                  title="Project"
                                  key={projectAncestorFocusArea?.project?.uid}
                                  width={24}
                                  height={24}
                                  src={projectAncestorFocusArea?.project?.logo?.url || '/icons/project-default.svg'}
                                  alt="project"
                                  className="lfa__focusareas__focusarea__avatar"
                                />;
                            }
                            })
                          }
                        </div>
                        { projectAncestorFocusAreas?.length > 0 && <img src={"/icons/arrow-blue-right.svg"} alt='project'/> }
                        </div>
                      </div>
                    }
                  </div>
                  <img className="lfa__focusareas__focusarea__icon" alt={focusArea?.title} src={image} />
                </div>
              );
              })
            }
          </div>
        </div>
      </div>
      <div className="mb__lfa">
        <div className="mb__lfa__hdr">
          <div className="mb__lfa__hdr__title">
            <div className="mb__lfa__titlesec">
              <img height={16} width={16} src="/icons/hexagon-wheels.svg" />
              <h2 className="mb__lfa__titles__ttl">Focus Areas</h2>
            </div>
            <div className="mb__lfa__descsec">
              <p className="mb__lfa__descsec__desc">
                <a href={protocolVisionUrl} target="_blank" className="mb__lfa__hdr__desc__link" onClick={onProtocolVisionUrlClick}> Protocol Labs’ vision </a> for the future is built on four core focus areas that aim to harness humanity’s potential for good, navigate potential pitfalls, and ensure a future where technology empowers humanity.</p>
            </div>
          </div>
        </div>
        <div className="mb__embla" ref={mb_emblaRef}>
          <div className="mb__lfa__focusareas mb__embla__container">
          {  
            focusAreas?.teamFocusAreas.map((focusArea: any, index: number) => {
              const image = `/icons/mb ${focusArea?.title?.toLowerCase()}.svg`;
              const teamAncestorFocusAreas = focusArea?.teamAncestorFocusAreas;
              const projectAncestorFocusAreas = focusAreas?.projectFocusAreas?.find((projectFocusArea: any) => {
                return projectFocusArea.title === focusArea.title
              })?.projectAncestorFocusAreas;
              const isLongName = focusArea?.title?.length > 16;
              const noOfCharactersNeedToShow =  isLongName ? 50 : 70;

              return (
                <div className="mb__lfa__focusareas__focusarea mb__embla__slide" key={`focusArea-${index}`}>
                  <div className="mb__lfa__focusareas__focusarea__header">
                    <h2 className="mb__lfa__focusareas__focusarea__header__title">{focusArea?.title}</h2>
                    <div>
                      <div className="mb__lfa__focusareas__focusarea__headers__desc">
                      { 
                        focusArea?.description?.length < noOfCharactersNeedToShow ? focusArea?.description : 
                          <div> {
                            focusArea?.description?.slice(0, noOfCharactersNeedToShow)+"..."}
                            <span className="lfa__focusarea__desc_seemore" onClick={()=>{
                               onClickSeeMore({...focusArea, projectAncestorFocusAreas });
                            }}>see more</span>
                          </div>
                      }
                      </div>
                    </div>
                  </div>
                  <div className="mb__lfa__focusareas__focusarea__footer">
                    {teamAncestorFocusAreas?.length > 0 && <div onClick={()=> {routeTo(focusArea, "Team")}} className="mb__lfa__focusareas__focusarea__footer__tms">
                      <div>
                        <div className="mb__lfa__focusareas__focusarea__footer__tms__cnt">{teamAncestorFocusAreas?.length}</div>
                        <div className="mb__lfa__focusareas__focusarea__footer__cnt__txt"> Teams
                          <img width={14} height={14}  src={"/icons/rounded-right-arrow.svg"} alt='team'/></div>
                      </div>
                    </div>}
                    {projectAncestorFocusAreas?.length  > 0 && <div  onClick={()=> {routeTo(focusArea, "Project")}} className="mb__lfa__focusareas__focusarea__footer__prts">
                    <div>
                      <div className="mb__lfa__focusareas__focusarea__footer__tms__cnt">{projectAncestorFocusAreas?.length}</div>
                      <div className="mb__lfa__focusareas__focusarea__footer__cnt__txt"> Projects 
                        <img width={14} height={14} src={"/icons/rounded-right-arrow.svg"} alt='project'/></div>
                      </div>
                    </div>}
                  </div>
                  <img  className="mb__lfa__focusareas__focusarea__icon" alt={focusArea?.title} src={image} />
                </div>
              );
            })
          }
          </div>
        </div>
        <div className="mb__lfa__focusareas__progress__bar">
          <div className="mb__embla__controls">
            <div className="mb__embla__progress">
              <div className="mb__embla__progress__bar" style={{ transform: `translate3d(${scrollProgress}%,0px,0px)` }}/>
            </div>
          </div>
        </div>
      </div>
     <FocusAreaDialog userInfo={userInfo}/>
      <style jsx>
        {`
          .lfa {
            display: none;
            flex-direction: column;
            gap: 12px;
          }

          .lfa__focusareas {
            display: flex;
          }

          .lfa__focusareas__focusarea {
            flex: 1;
            background-color: white;
            border-radius: 8px;
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 30px;
            position: relative;
            z-index: 1;
          }

          .lfa__focusareas__focusarea__icon {
            position: absolute;
            right: 0;
            top: 0;
            z-index: -2;
          }

          .lfa__focusareas__focusarea__header {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .lfa__focusareas__focusarea__header__title {
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .lfa__focusareas__focusarea__headers__desc {
            font-size: 14px;
            font-weight: 400;
            line-height: 22px;
          }

          .lfa__focusarea__desc_seemore {
            font-weight: 500;
            color: #156ff7;
          }

          .lfa__focusareas__focusarea__footer {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .focusareas__focusarea__footer__info {
            display: flex;
            align-items: center;
          }

          .lfa__focusareas__focusarea__footer__tms {
            display: flex;
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
            font-size: 11px;
            line-height: 20px;
            justify-content: space-between;
            align-items: center;
          }

          .lfa__focusareas__focusarea__footer__prts {
            display: flex;
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
            font-size: 11px;
            line-height: 20px;
            justify-content: space-between;
          }

          .lfa__focusareas__focusarea__footer__txt {
            font-size: 11px;
            line-height: 20px;
          }

          .lfa__focusareas__focusarea__footer__count {
            font-size: 18px;
            font-weight: 600;
            padding-right: 5px;
            line-height: 20px;
          }

          .lfa__focusareas__focusarea__footer__right_icon {
            width: 16px;
            height: 16px;
            marging-left: 30px;
          }

          .lfa__focusareas__focusarea__avartars__cnt {
            display: flex;
            gap: 5px;
            cursor: pointer;
          }

          .lfa__focusareas__focusarea__avatars {
            display: flex;
            align-items: center;
            margin-right: 10px;
          }

          .lfa__focusareas__focusarea__avatar {
            border-radius: 4px;
            background-color: #e2e8f0;
            object-fit: cover;
            border: 1px solid #cbd5e1;
            margin-right: -10px;
          }

          .embla {
            position: relative;
            overflow: hidden;
            padding: 10px 0px 20px 2px;
          }

          .embla__container {
            display: flex;
            gap: 14px;
          }

          .embla__slide {
            flex: 0 0 289px;
            min-width: 0;
            cursor: pointer;
          }

          @media (min-width: 1024px) {
            .lfa {
              display: flex;
            }
          }

          .mb__lfa {
            display: none;
            flex-direction: column;
            margin-bottom: 10px;
          }

          .mb__lfa__focusareas {
            display: flex;
            gap: 14px;
          }

          .mb__lfa__hdr {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .mb__lfa__hdr__title {
            display: flex;
            flex-direction: column;
          }

          .mb__lfa__titlesec {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .mb__lfa__hdr__desc__link {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #156ff7;
            cursor: pointer;
          }

          .mb__lfa__descsec__desc {
            color: #64748b;
            font-size: 14px;
            line-height: 24px;
            font-weight: 400;
          }

          .mb__lfa__titles__ttl {
            font-size: 16px;
            line-height: 32px;
            font-weight: 500;
          }

          .mb__lfa__focusareas {
            display: flex;
            gap: 8px;
          }

          .mb__lfa__focusareas__focusarea {
            flex: 1;
            background-color: white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            z-index: 1;
          }

          .mb__lfa__focusareas__focusarea__header {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 16px;
            height: 150px;
          }

          .mb__lfa__focusareas__focusarea__header__title {
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .mb__lfa__focusareas__focusarea__headers__desc {
            font-size: 13px;
            font-weight: 400;
            line-height: 20px;
          }

          .mb__lfa__focusareas__focusarea__footer {
            height: 72px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            background-color: white;
          }

          .mb__lfa__focusareas__focusarea__footer__tms {
            flex:1;
            border-right: 1px solid #e2e8f0;
            font-size: 11px;
            line-height: 20px;
            font-weight: 400;
            display: flex;
            align-items: center;
            justify-content: center; 
            flex-direction: column;
            padding: 0px 12px;
          }

          .mb__lfa__focusareas__focusarea__footer__tms__cnt {
            font-size: 20px;
            line-height: 20px;
            font-weight: 600;
          }

          .mb__lfa__focusareas__focusarea__footer__prts {
            flex:1;
            font-size: 11px;
            line-height: 20px;
            font-weight: 400;
            display: flex;
            align-items: center;
            padding: 0px 12px;
            justify-content: center; 
            flex-direction: column;
          }

          .mb__lfa__focusareas__focusarea__footer__prts__cnt {
            font-size: 20px;
            line-height: 20px;
            font-weight: 600;
          }

          .mb__lfa__focusareas__focusarea__footer__cnt__txt {
            display: flex;
            gap: 2px;
            align-items: center;
          }

          .mb__lfa__focusareas__focusarea__icon {
            position: absolute;
            right: 0;
            top: 0;
            z-index: -2;
          }

          .mb__embla {
            position: relative;
            overflow: hidden;
            padding: 10px 0px 20px 2px;
          }

          .mb__embla__container {
            display: flex;
            gap: 8px;
          }

          .mb__embla__slide {
            flex: 0 0 162px;
            min-width: 0;
            cursor: pointer;
          }

          .mb__lfa__focusareas__progress__bar {
            display: none;
            width: 100%;
            justify-content: center;
          }

          .mb__embla__progress {
            border-radius: 6px;
            background-color: #cbd5e1;
            position: relative;
            height: 7px;
            justify-self: flex-end;
            align-self: center;
            width: 99px;
            max-width: 90%;
            overflow: hidden;
          }

          .mb__embla__progress__bar {
            background-color: #156ff7;
            position: absolute;
            width: 100%;
            top: 0;
            bottom: 0;
            left: -100%;
          }

          @media (max-width: 1023px) {
            .mb__lfa {
              display: flex;
            }
            .mb__lfa__focusareas__progress__bar {
              display: flex;
            }

            .mb__lfa__titlesec {
              gap: 4px;
            }
          }
        `}
      </style>
    </>
  );
};

export default LandingFocusAreas;
