import React from 'react';
import { AppSearchMobile } from '@/components/core/application-search/components/AppSearchMobile';
import { AppSearchDesktop } from '@/components/core/application-search/components/AppSearchDesktop';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export const ApplicationSearch = ({ isLoggedIn, userInfo }: Props) => {
  return (
    <>
      <AppSearchDesktop isLoggedIn={isLoggedIn} userInfo={userInfo} />
      <AppSearchMobile isLoggedIn={isLoggedIn} userInfo={userInfo} />
    </>
  );
};
