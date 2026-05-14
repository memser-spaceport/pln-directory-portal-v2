'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';

import { triggerLoader } from '@/utils/common.utils';

import { TeamsFilter } from '../TeamsFilter';
import s from './TeamsFilterWrapper.module.scss';

interface IFilterwrapper {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
}

export function TeamsFilterWrapper(props: IFilterwrapper) {
  const filterValues = props?.filterValues;
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;

  const router = useRouter();

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  return (
    <div className={s.root}>
      <div className={s.web}>
        <TeamsFilter filterValues={filterValues} searchParams={searchParams} userInfo={userInfo} />
      </div>
    </div>
  );
}
