'use client';
import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import { TeamsFilter } from './TeamsFilter';
import { useEffect } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

interface IFilterwrapper {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
}

/**
 * FilterWrapper - Teams filter container (Desktop only)
 *
 * Displays desktop filter in sidebar. Mobile filter is handled by
 * TeamsMobileFilters component in team-list.tsx using Dialog.
 */
export default function FilterWrapper(props: IFilterwrapper) {
  const filterValues = props?.filterValues;
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;

  const router = useRouter();

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  return (
    <div className="fw">
      <div className="fw__web">
        <TeamsFilter filterValues={filterValues} searchParams={searchParams} userInfo={userInfo} />
      </div>

      <style jsx>
        {`
          .fw {
            width: inherit;
            height: inherit;
          }

          .fw__web {
            display: none;
          }

          @media (min-width: 1024px) {
            .fw__web {
              display: unset;
              width: inherit;
              height: inherit;
            }
          }
        `}
      </style>
    </div>
  );
}
