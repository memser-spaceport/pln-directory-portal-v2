'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { CommentIcon } from '@/components/icons';
import { Button, type ButtonProps } from '@/components/common/Button';
import { GiveAiAppFeedbackDialog } from '../GiveAiAppFeedbackDialog';

import s from './FloatingFeedbackButton.module.scss';

interface Props {
  /** When provided (app detail page), preselects this app in the feedback picker. */
  appUid?: string;
  appName?: string;
  buttonProps?: Partial<ButtonProps>;
}

export function FloatingFeedbackButton(props: Props) {
  const { appUid, appName, buttonProps } = props;
  const { className: buttonClassName, ...restButtonProps } = buttonProps ?? {};

  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const analytics = useAiAppsAnalytics();
  const { permsSet, isLoading } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);

  if (isLoading || !hasAccess) {
    return null;
  }

  return (
    <>
      <div ref={wrapRef} className={s.wrap}>
        <Button
          size="s"
          style="fill"
          variant="primary"
          className={buttonClassName ?? clsx(s.button, s.headerButton)}
          onClick={() => {
            analytics.onFeedbackDialogOpened(appUid ? { appUid, appName } : {});
            setIsOpen(true);
          }}
          {...restButtonProps}
        >
          <CommentIcon />
          Give feedback
        </Button>
      </div>
      <GiveAiAppFeedbackDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appUid={appUid}
        appName={appName}
        anchorRef={wrapRef}
      />
    </>
  );
}
