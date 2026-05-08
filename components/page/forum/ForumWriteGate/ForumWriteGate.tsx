'use client';

import React from 'react';
import { useForumWriteAccess } from '@/services/access-control/hooks/useForumWriteAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Spinner } from '@/components/ui/Spinner';
import s from '@/app/forum/page.module.scss';

interface ForumWriteGateProps {
  children: React.ReactNode;
}

export const ForumWriteGate = ({ children }: ForumWriteGateProps) => {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canWrite, isLoading } = useForumWriteAccess();

  if (!isHydrated || isLoading) {
    return (
      <div className={s.root}>
        <Spinner />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={s.root}>
        <LoggedOutView />
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
