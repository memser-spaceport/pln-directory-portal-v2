import React from 'react';
import { AppSearchMobile } from '@/components/core/application-search/components/AppSearchMobile';
import { AppSearchDesktop } from '@/components/core/application-search/components/AppSearchDesktop';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

export const ApplicationSearch = ({ isLoggedIn, userInfo, authToken }: Props) => {
  return (
    <>
      <AppSearchDesktop isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
      <AppSearchMobile isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
    </>
  );
};
