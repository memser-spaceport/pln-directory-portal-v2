'use client';

import { useState } from 'react';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { CommentIcon } from '@/components/icons';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';

import s from './FloatingFeedbackButton.module.scss';

interface Props {
  /** When provided (app detail page), feedback applies to this app and no picker is shown. */
  appUid?: string;
  appName?: string;
}

export function FloatingFeedbackButton({ appUid, appName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { permsSet, isLoading } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  if (isLoading || !hasAccess) {
    return null;
  }

  return (
    <>
      <button type="button" className={s.floatingButton} onClick={() => setIsOpen(true)}>
        <CommentIcon />
        Give feedback
      </button>
      <GiveAiAppFeedbackDialog isOpen={isOpen} onClose={() => setIsOpen(false)} appUid={appUid} appName={appName} />
    </>
  );
}
