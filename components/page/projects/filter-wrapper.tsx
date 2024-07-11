'use client';
import { IUserInfo } from '@/types/shared.types';
import { ITeamsSearchParams } from '@/types/teams.types';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import ProjectFilter from './project-filter';

interface IFilterwrapper {
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
  focusAreas: any;
  selectedTeam: any
  initialTeams: any;
}

export default function FilterWrapper(props: IFilterwrapper) {
  const [isMobileFilter, setIsMobileFilter] = useState(false);
  const selectedTeam = props?.selectedTeam;
  const router = useRouter();

  useEffect(() => {
    document.addEventListener(EVENTS.SHOW_PROJECTS_FILTER, (e: any) => {
      setIsMobileFilter(e.detail);
    });

    document.removeEventListener(EVENTS.SHOW_PROJECTS_FILTER, () => {});
  }, []);

  useEffect(() => {
    triggerLoader(false);
  }, [router, props?.searchParams]);

  return (
    <div className="fw">
      {isMobileFilter && (
        <div className="fw__mob">
          <ProjectFilter {...props} />
        </div>
      )}
      <div className="fw__web">
        <ProjectFilter {...props} />
      </div>
      <style jsx>
        {`
        
        .fw {width: inherit;}

        .fw__web {
        display: none}

        .fw__mob {
        position: fixed;
        top: 0;
        z-index: 5;
        height: 100%;
        width: 100%;
        }


        @media(min-width: 1024px){ 
         .fw__web {
          display: unset;
          height: 150vh;
          width: inherit;
          }
         .fw__mob {
          display: none;
          }
        }
      }
        
        `}
      </style>

      <style jsx global>
        {`
          html {
            overflow: ${isMobileFilter ? 'hidden' : 'auto'};
          }
        `}
      </style>
    </div>
  );
}
