'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { Button, type ButtonProps } from '@/components/common/Button';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';

import s from './FloatingFeedbackButton.module.scss';

interface Props {
  floating?: boolean;
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
  /** Align the button with the page's max-width content column instead of the viewport edge. */
  alignToContent?: boolean;
  buttonProps?: Partial<ButtonProps>;
}

export function FloatingFeedbackButton(props: Props) {
  const { appUid, appName, floating = true, buttonProps, alignToContent } = props;

  const [isOpen, setIsOpen] = useState(false);
  const analytics = useAiAppsAnalytics();
  const { permsSet, isLoading } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  if (isLoading || !hasAccess) {
    return null;
  }

  return (
    <>
      <Button
        size="s"
        style="fill"
        variant="primary"
        className={clsx(s.button, {
          [s.floating]: floating,
          [s.alignToContent]: alignToContent,
        })}
        onClick={() => {
          analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
          setIsOpen(true);
        }}
        {...buttonProps}
      >
        <CommentIcon />
        Give feedback
      </Button>
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
