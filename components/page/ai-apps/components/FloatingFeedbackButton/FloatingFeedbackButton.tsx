'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';

import s from './FloatingFeedbackButton.module.scss';

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
  /** Align the button with the page's max-width content column instead of the viewport edge. */
  alignToContent?: boolean;
}

export function FloatingFeedbackButton({ appUid, appName, alignToContent }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const analytics = useAiAppsAnalytics();
  const { permsSet, isLoading } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  if (isLoading || !hasAccess) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={clsx(s.floatingButton, alignToContent && s.alignToContent)}
        onClick={() => {
          analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
          setIsOpen(true);
        }}
      >
        <CommentIcon />
        Give feedback
      </button>
      <GiveAiAppFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appUid={appUid}
        appName={appName}
        alignToContent={alignToContent}
      />
    </>
  );
}
