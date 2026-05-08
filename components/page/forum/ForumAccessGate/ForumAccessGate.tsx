'use client';

import React from 'react';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Spinner } from '@/components/ui/Spinner';
import s from '@/app/forum/page.module.scss';
import clsx from 'clsx';

interface ForumAccessGateProps {
  children: React.ReactNode;
}

export const ForumAccessGate = ({ children }: ForumAccessGateProps) => {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { hasAccess, isLoading } = useForumAccess();

  if (!isHydrated || isLoading) {
    return (
      <div className={clsx(s.root, s.center)}>
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

  if (!hasAccess) {
    return (
      <div className={s.root}>
        <LoggedOutView reason="no-access" />
      </div>
    );
  }

  return <>{children}</>;
};
