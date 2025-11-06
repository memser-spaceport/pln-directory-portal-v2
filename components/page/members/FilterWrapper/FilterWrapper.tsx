'use client';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { useEffect, useState } from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { MembersFilter } from '../MembersFilter';

import s from './FilterWrapper.module.scss';

interface IFilterwrapper {
  filterValues: any;
  userInfo: IUserInfo;
  searchParams: any;
  isUserLoggedIn: boolean;
}

export default function FilterWrapper(props: IFilterwrapper) {
  const searchParams = props?.searchParams;

  const router = useRouter();

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  return (
    <div className={s.root}>
      <MembersFilter {...props} />
    </div>
  );
}
