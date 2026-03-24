'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Modal from '@/components/core/modal';
import { IFocusArea, IUserInfo } from '@/types/shared.types';
import { HOME } from '@/utils/constants';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo, getAnalyticsFocusAreaInfo } from '@/utils/common.utils';

import s from './FocusAreaDialog.module.scss';

interface Props {
  userInfo: IUserInfo;
}

export function FocusAreaDialog(props: Props) {
  const { userInfo } = props;

  const focusAreaModalRef = useRef<HTMLDialogElement>(null);
  const [focusArea, setFocusArea] = useState<any>();
  const analytics = useHomeAnalytics();

  const onClose = () => {
    focusAreaModalRef.current?.close();
    setFocusArea(null);
  };

  const handleFocusAreaEvent = useCallback((e: any) => {
    setFocusArea(e?.detail?.focusArea);
    focusAreaModalRef.current?.showModal();
  }, []);

  useEffect(() => {
    document.addEventListener(HOME.TRIGGER_FOCUS_AREA_DIALOG, handleFocusAreaEvent);
    return () => {
      document.removeEventListener(HOME.TRIGGER_FOCUS_AREA_DIALOG, handleFocusAreaEvent);
    };
  }, [handleFocusAreaEvent]);

  const routeTo = (fa: IFocusArea, type: string) => {
    if (type === 'Team') {
      window.open(`/teams?focusAreas=${fa.title}`, '_blank');
      analytics.onFocusAreaTeamsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(fa));
    } else {
      window.open(`/projects?focusAreas=${fa.title}`, '_blank');
      analytics.onFocusAreaProjectsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsFocusAreaInfo(fa));
    }
  };

  return (
    <Modal modalRef={focusAreaModalRef} onClose={onClose}>
      {/* Desktop dialog */}
      <div className={s.desktop}>
        <div className={s.headerSection}>
          <h2 className={s.title}>{focusArea?.title}</h2>
          <div className={s.description}>{focusArea?.description}</div>
        </div>
        <div className={s.footer}>
          <div className={s.footerRow}>
            <div>
              <span className={s.footerCount}>{focusArea?.teamAncestorFocusAreas?.length || 0}</span>
              <span className={s.footerText}>Teams</span>
            </div>
            <div className={s.avatarsContainer}>
              <div className={s.avatars}>
                {focusArea?.teamAncestorFocusAreas?.slice(0, 3).map((item: any) => (
                  <img
                    title="team"
                    key={item?.team?.uid}
                    width={24}
                    height={24}
                    src={item?.team?.logo?.url}
                    alt="team"
                    className={s.avatar}
                  />
                ))}
              </div>
              {focusArea?.teamAncestorFocusAreas?.length > 0 && (
                <img
                  onClick={() => routeTo(focusArea, 'Team')}
                  src="/icons/arrow-blue-right.svg"
                  alt="project"
                />
              )}
            </div>
          </div>
          <div className={s.footerRow}>
            <div>
              <span className={s.footerCount}>{focusArea?.projectAncestorFocusAreas?.length || 0}</span>
              <span className={s.footerText}>Projects</span>
            </div>
            <div className={s.avatarsContainer}>
              <div className={s.avatars}>
                {focusArea?.projectAncestorFocusAreas?.slice(0, 3).map((item: any) => (
                  <img
                    title="project"
                    key={item?.project?.uid}
                    width={24}
                    height={24}
                    src={item?.project?.logo?.url}
                    alt="project"
                    className={s.avatar}
                  />
                ))}
              </div>
              {focusArea?.projectAncestorFocusAreas?.length > 0 && (
                <img
                  onClick={() => routeTo(focusArea, 'Project')}
                  src="/icons/arrow-blue-right.svg"
                  alt="project"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dialog */}
      <div className={s.mobile}>
        <div className={s.mobileHeaderSection}>
          <h2 className={s.mobileTitle}>{focusArea?.title}</h2>
          <div className={s.mobileDescription}>{focusArea?.description}</div>
        </div>
        <div className={s.mobileFooter}>
          {focusArea?.teamAncestorFocusAreas?.length > 0 && (
            <div className={s.mobileTeamsSection}>
              <div className={s.mobileCount}>{focusArea?.teamAncestorFocusAreas?.length}</div>
              <div className={s.mobileCountText}>
                Teams
                <img
                  width={14}
                  height={14}
                  src="/icons/rounded-right-arrow.svg"
                  onClick={() => routeTo(focusArea, 'Team')}
                  alt="team"
                />
              </div>
            </div>
          )}
          {focusArea?.projectAncestorFocusAreas?.length > 0 && (
            <div className={s.mobileProjectsSection}>
              <div className={s.mobileCount}>{focusArea?.projectAncestorFocusAreas?.length}</div>
              <div className={s.mobileCountText}>
                Projects
                <img
                  width={14}
                  height={14}
                  src="/icons/rounded-right-arrow.svg"
                  onClick={() => routeTo(focusArea, 'Project')}
                  alt="project"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
