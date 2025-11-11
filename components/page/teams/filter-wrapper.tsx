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
 * FilterWrapper - Teams filter container
 *
 * Now uses the new TeamsFilter component with modern generic infrastructure.
 * Mobile version is handled by TeamsFilter using FiltersSidePanel which is responsive.
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
            width: inherit;
            height: inherit;
          }
        `}
      </style>
    </div>
  );
}
