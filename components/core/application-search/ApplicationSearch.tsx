import React from 'react';
import { AppSearchMobile } from '@/components/core/application-search/components/AppSearchMobile';
import { AppSearchDesktop } from '@/components/core/application-search/components/AppSearchDesktop';

export const ApplicationSearch = () => {
  return (
    <>
      <AppSearchDesktop />
      <AppSearchMobile />
    </>
  );
};
