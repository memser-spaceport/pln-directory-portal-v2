'use client';
import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import Filter from './filter';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';

interface IFilterwrapper {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
}

export default function FilterWrapper(props: IFilterwrapper) {
  const filterValues = props?.filterValues;
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;

  const [isMobileFilter, setIsMobileFilter] = useState(false);

  useEffect(() => {
    document.addEventListener(EVENTS.SHOW_FILTER, (e: any) => {
      setIsMobileFilter(e.detail);
    });

    document.removeEventListener(EVENTS.SHOW_FILTER, () => {});
  }, []);

  return (
    <div className="fw">
      {isMobileFilter && (
        <div className="fw__mob">
          <Filter filterValues={filterValues} searchParams={searchParams} userInfo={userInfo} />
        </div>
      )}
      <div className="fw__web">
        <Filter filterValues={filterValues} searchParams={searchParams} userInfo={userInfo} />
      </div>
      <style jsx>
        {`
        
        .fw {width: inherit;}

        .fw__web {
        display: none}

        .fw__mob {
        position: fixed;
        top: 0;
        z-index: 4;
        height: 100%;
        width: 100%;
        }


        @media(min-width: 1024px){ 
         .fw__web {
          display: unset;
          width: inherit;
          }
         .fw__mob {
          display: none;
          }
        }
      }
        
        `}
      </style>

      <style global>
        {`
        html {
        overflow: ${isMobileFilter ? 'hidden' : 'auto'}}
        `}
      </style>
    </div>
  );
}
