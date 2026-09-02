'use client';
import { IUserInfo } from '@/types/shared.types';
import { ITeamsSearchParams } from '@/types/teams.types';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EVENTS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import ProjectFilter from './project-filter';
import s from './filter-wrapper.module.scss';

interface IFilterwrapper {
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
  focusAreas: any;
  selectedTeam: any;
  initialTeams: any;
  filters: any;
}

export default function FilterWrapper(props: IFilterwrapper) {
  const [isMobileFilter, setIsMobileFilter] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleShowFilter = (e: Event) => {
      setIsMobileFilter((e as CustomEvent<boolean>).detail);
    };

    document.addEventListener(EVENTS.SHOW_PROJECTS_FILTER, handleShowFilter);
    return () => {
      document.removeEventListener(EVENTS.SHOW_PROJECTS_FILTER, handleShowFilter);
    };
  }, []);

  useEffect(() => {
    triggerLoader(false);
  }, [router, props?.searchParams]);

  useEffect(() => {
    if (!isMobileFilter) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isMobileFilter]);

  return (
    <div className={s.root}>
      {isMobileFilter &&
        createPortal(
          <div className={s.mob} data-testid="projects-mobile-filter">
            <ProjectFilter {...props} />
          </div>,
          document.body,
        )}
      <div className={s.web}>
        <ProjectFilter {...props} />
      </div>
    </div>
  );
}
