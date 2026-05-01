'use client';

import React from 'react';
import { useForumWriteAccess } from '@/services/access-control/hooks/useForumWriteAccess';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Spinner } from '@/components/ui/Spinner';
import s from '@/app/forum/page.module.scss';

interface ForumWriteGateProps {
  children: React.ReactNode;
}

export const ForumWriteGate = ({ children }: ForumWriteGateProps) => {
  const { userInfo } = getCookiesFromClient();
  const { canWrite, isLoading } = useForumWriteAccess();

  if (!userInfo) {
    return (
      <div className={s.root}>
        <LoggedOutView />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={s.root}>
        <Spinner />
      </div>
    );
  }

  if (!canWrite) {
    return (
      <div className={s.root}>
        <LoggedOutView reason="base" />
      </div>
    );
  }

  return <>{children}</>;
};
