'use client';
import { useRef, useState, useEffect } from 'react';
import Modal from '@/components/core/modal';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo, getAnalyticsFocusAreaInfo } from '@/utils/common.utils';
import { HOME } from '@/utils/constants';

const FocusAreaDialog = (props: any) => {
  const { userInfo } = props;
  const focusAreaModalRef = useRef<HTMLDialogElement>(null);
  const [focusArea, setFocusArea] = useState<any>();
  const analytics = useHomeAnalytics();
  
  const onClose = () => {
    focusAreaModalRef.current?.close();
    setFocusArea(null);
  };

  useEffect(() => {
    async function updateFocusArea(focusArea: any) {
      setFocusArea(focusArea);
      if (focusAreaModalRef?.current) {
        focusAreaModalRef.current.showModal();
      }
    }
    document.addEventListener(HOME.TRIGGER_FOCUS_AREA_DIALOG, (e: any) => {
      updateFocusArea(e?.detail?.focusArea);
    });
    return () => {
      document.removeEventListener(HOME.TRIGGER_FOCUS_AREA_DIALOG, (e: any) => {
        updateFocusArea(e?.detail?.focusArea);
      });
    };
  }, []);

  const routeTo = (focusArea: any, type: string) => {
    if (type === 'Team') {
      window.open(`/teams?focusAreas=${focusArea.title}`, '_blank');
      analytics.onFocusAreaTeamsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
    } else {
      window.open(`/projects?focusAreas=${focusArea.title}`, '_blank');
      analytics.onFocusAreaProjectsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(focusArea));
    }
  }
  
  return (
    <>
      <Modal modalRef={focusAreaModalRef} onClose={onClose}>
        <div className="lfa__focusareas__focusarea">
          <div className="lfa__focusareas__focusarea__header">
            <h2 className="lfa__focusareas__focusarea__header__title">{focusArea?.title}</h2>
            <div className="lfa__focusareas__focusarea__headers__desc">
              { focusArea?.description }
            </div>
          </div>
          <div className="lfa__focusareas__focusarea__footer">
            <div className="lfa__focusareas__focusarea__footer__tms">
              <div>
                <span className="lfa__focusareas__focusarea__footer__count"> {focusArea?.teamAncestorFocusAreas?.length || 0}</span> 
                <span className="lfa__focusareas__focusarea__footer__txt">Teams</span>
              </div>
              <div className="lfa__focusareas__focusarea__avartars__cnt">
                <div className="lfa__focusareas__focusarea__avatars">
                  {
                    focusArea?.teamAncestorFocusAreas?.map((teamAncestorFocusArea: any, index: number) => {
                      if (index < 3) {
                        return <img 
                          title="team" 
                          key={teamAncestorFocusArea?.team?.uid} 
                          width={24} 
                          height={24} 
                          src={teamAncestorFocusArea?.team?.logo?.url}
                          alt="team" 
                          className="lfa__focusareas__focusarea__avatar"
                        />;
                      }
                    })
                  }
                </div>
                { focusArea?.teamAncestorFocusAreas?.length > 0 && <img onClick={()=> {routeTo(focusArea, "Team")}} src={"/icons/arrow-blue-right.svg"} alt='project'/> }
              </div>
            </div>
            <div className="lfa__focusareas__focusarea__footer__prts">
              <div>
                <span className="lfa__focusareas__focusarea__footer__count"> { focusArea?.projectAncestorFocusAreas?.length || 0 } </span> 
                <span className="lfa__focusareas__focusarea__footer__txt">Projects</span>
              </div>
              <div className="lfa__focusareas__focusarea__avartars__cnt">
                <div className="lfa__focusareas__focusarea__avatars">
                  { focusArea?.projectAncestorFocusAreas?.map((projectAncestorFocusArea: any, index: number) => {
                      if (index < 3) {
                        return <img 
                          title="project" 
                          key={projectAncestorFocusArea?.project?.uid} 
                          width={24} 
                          height={24} 
                          src={projectAncestorFocusArea?.project?.logo?.url}
                          alt="project" 
                          className="lfa__focusareas__focusarea__avatar"
                        />;
                      }
                    })
                  }
                </div>
                {focusArea?.projectAncestorFocusAreas?.length > 0 && <img onClick={()=> {routeTo(focusArea, "Project")}} src={"/icons/arrow-blue-right.svg"} alt='project'/> }
              </div>
            </div>
          </div>
        </div>
        <div className="mb__lfa__focusareas__focusarea">
          <div className="mb__lfa__focusareas__focusarea__header">
            <h2 className="mb__lfa__focusareas__focusarea__header__title">{focusArea?.title}</h2>
            <div>
              <div className="mb__lfa__focusareas__focusarea__headers__desc">
              { focusArea?.description }
              </div>
            </div>
          </div>
          <div className="mb__lfa__focusareas__focusarea__footer">
            {focusArea?.teamAncestorFocusAreas?.length > 0 &&  <div className="mb__lfa__focusareas__focusarea__footer__tms">
              <div className="mb__lfa__focusareas__focusarea__footer__tms__cnt">{focusArea?.teamAncestorFocusAreas?.length}</div>
              <div className="mb__lfa__focusareas__focusarea__footer__cnt__txt"> Teams
                <img width={14} height={14}  src={"/icons/rounded-right-arrow.svg"} onClick={()=> {routeTo(focusArea, "Team")}} alt='team'/></div>
            </div>}
            {focusArea?.projectAncestorFocusAreas?.length > 0 && <div className="mb__lfa__focusareas__focusarea__footer__prts">
              <div className="mb__lfa__focusareas__focusarea__footer__tms__cnt">{focusArea?.projectAncestorFocusAreas?.length}</div>
              <div className="mb__lfa__focusareas__focusarea__footer__cnt__txt"> Projects
                <img width={14} height={14} src={"/icons/rounded-right-arrow.svg"} onClick={()=> {routeTo(focusArea, "Project")}} alt='project'/></div>
            </div>}
          </div>
        </div>
      </Modal>
      <style jsx>
      {`
      .lfa__focusareas__focusarea {
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        display: none;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        width: 656px;
        z-index:  1;
      }

      .lfa__focusareas__focusarea__header {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .lfa__focusareas__focusarea__header__title {
        font-size: 24px;
        line-height: 32px;
        font-weight: 700;
      }

      .lfa__focusareas__focusarea__headers__desc {
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
      }

      .lfa__focusarea__desc_seemore {
        font-weight: 500; 
        color: #156ff7;
      }

      .lfa__focusareas__focusarea__footer {
        display: flex;
        gap: 8px;
        justify-content: space-between;
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
        width: 50%;
      }

      .lfa__focusareas__focusarea__footer__prts {
        display: flex;
        padding: 8px;
        background-color: #f1f5f9;
        border-radius: 4px;
        font-size: 11px;
        line-height: 20px;
        justify-content: space-between;
        width: 50%;
      }

      .lfa__focusareas__focusarea__footer__txt {
        font-size: 11px;
        line-height: 20px;
        font-weight: 400;
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

      .mb__lfa__focusareas__focusarea {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        display: none;
        flex-direction: column;
        justify-content: space-between;
        z-index: 1;
        width: 327px;
      }

      .mb__lfa__focusareas__focusarea__header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 32px 24px 24px 24px;
      }

      .mb__lfa__focusareas__focusarea__header__title {
        font-size: 24px;
        line-height: 32px;
        font-weight: 600;
      }

      .mb__lfa__focusareas__focusarea__headers__desc {
        font-size: 13px;
        font-weight: 400;
        line-height: 20px;
      }

      .mb__lfa__focusareas__focusarea__footer {
        height: 56px;
        border-top: 1px solid #E2E8F0;
        display: flex;
        background-color: white;
      }

      .mb__lfa__focusareas__focusarea__footer__tms {
        flex: 1;
        border-right: 1px solid #E2E8F0;
        padding:16px;
        font-size: 11px;
        line-height: 20px;
        font-weight: 400;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .mb__lfa__focusareas__focusarea__footer__tms__cnt {
        font-size: 20px;
        line-height: 20px;
        font-weight: 600;
      }

      .mb__lfa__focusareas__focusarea__footer__prts {
        flex: 1;
        padding:16px;
        font-size: 11px;
        line-height: 20px;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: center;
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

      @media (min-width: 1024px) {
        .lfa__focusareas__focusarea {
          display: flex;
        }
      }

      @media (max-width: 1023px) {
        .mb__lfa__focusareas__focusarea {
          display: flex;
        }
      }
      `}
      </style>
    </>
  );
};
export default FocusAreaDialog;
  