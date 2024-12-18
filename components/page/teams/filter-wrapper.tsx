'use client';
import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import Filter from './filter';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';
import { usePathname, useRouter } from 'next/navigation';

interface IFilterwrapper {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
  timeAnalysis: any;
}

export default function FilterWrapper(props: IFilterwrapper) {
  const filterValues = props?.filterValues;
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;
  const timeAnalysis = props?.timeAnalysis;

  const [isMobileFilter, setIsMobileFilter] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.addEventListener(EVENTS.SHOW_FILTER, (e: any) => {
      setIsMobileFilter(e.detail);
    });

    document.removeEventListener(EVENTS.SHOW_FILTER, () => {});
  }, []);


  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  const pathname = usePathname();


  useEffect(()=>{
    timeAnalysis[`final-render-time`]=Date.now().toString()
    const timediff = {} as any;
    timediff[`middleware-difference`] = timeAnalysis.middlewareEndTime - timeAnalysis.middlewareStartTime
    timediff[`middleware-to-page-difference`] = timeAnalysis.beforeCallingApi - timeAnalysis.middlewareEndTime
    timediff[`apicall-diference`] = timeAnalysis.afterApiCall - timeAnalysis.beforeCallingApi
    timediff[`sever-client-render-difference`] = Date.now() - timeAnalysis[`afterFormatted`]
    timediff[`auth-api-difference`] = timeAnalysis.middlewareAuthEnd - timeAnalysis.middlewareAuthStart


    console.log("teams", timeAnalysis, timediff)

  },[pathname, router, searchParams])


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
        z-index: 5;
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

      <style jsx global>
        {`
        html {
        overflow: ${isMobileFilter ? 'hidden' : 'auto'}}
        `}
      </style>
    </div>
  );
}
