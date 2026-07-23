'use client';

import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { MenuIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';
import { AI_APPS_LOGS_ENABLED } from '@/utils/feature-flags';

import s from './AppActionsMenu.module.scss';

interface Props {
  app: AiApp;
  /** Called when "Edit details" is chosen. */
  onEdit: () => void;
  /** Called when "Deployment settings" is chosen. */
  onDeployment: () => void;
  /** Called when "Deployment logs" is chosen. */
  onLogs: () => void;
  /** Called when "Delete app" is chosen. */
  onDelete: () => void;
}

/**
 * The kebab (⋯) "more actions" menu housing every manage action for an app.
 * The trigger is rendered off a client-side heuristic (creator or directory
 * admin — the parent decides), but the authoritative gate is the detail
 * endpoint's `canManage`: opening the menu fetches it and the items stay
 * disabled until it confirms. A fresh "no access" answer removes the menu
 * entirely; a failed check only degrades to disabled items — it must never
 * yank the menu out from under the pointer.
 */
export function AppActionsMenu({ app, onEdit, onDeployment, onLogs, onDelete }: Props) {
  const analytics = useAiAppsAnalytics();
  const [isOpen, setIsOpen] = useState(false);

  // Gated here, not in the parents, so grid and detail page can't drift: a
  // DRAFT has never built, so it has no logs to show; the flag stays off until
  // the backend accepts owner/admin tokens on the logs endpoints.
  const showLogsItem = AI_APPS_LOGS_ENABLED && app.status !== 'DRAFT';

  const { app: detail, errorKind } = useAiApp(app.uid, { enabled: isOpen });

  // Older API versions omit `canManage` on the detail record; the heuristic
  // that rendered this trigger is then the best signal we have, so default on.
  const confirmedCanManage = detail ? (detail.canManage ?? true) : null;
  // 403/404 are authoritative "you can't manage this" answers too. Derived,
  // not stored: rendering null unmounts the trigger AND the open popup.
  // const accessDenied = confirmedCanManage === false || errorKind === 'forbidden' || errorKind === 'not-found';
  // if (accessDenied) return null;

  const verifying = confirmedCanManage !== true;
  const verifyFailed = errorKind === 'network';

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) analytics.onManageMenuOpened(app.uid, app.name);
  };

  return (
    <Menu.Root modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <Menu.Trigger
        className={s.trigger}
        aria-label={`More actions for ${app.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuIcon width={20} height={20} color="#455468" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} align="end" sideOffset={6}>
          <Menu.Popup className={s.popup}>
            <Menu.Item className={s.item} disabled={verifying} onClick={onEdit}>
              Edit details
            </Menu.Item>
            <Menu.Item className={s.item} disabled={verifying} onClick={onDeployment}>
              Deployment settings
            </Menu.Item>
            {showLogsItem && (
              <Menu.Item className={s.item} disabled={verifying} onClick={onLogs}>
                Deployment logs
              </Menu.Item>
            )}
            <div className={s.divider} role="separator" />
            <Menu.Item className={`${s.item} ${s.destructive}`} disabled={verifying} onClick={onDelete}>
              Delete app
            </Menu.Item>
            {verifyFailed && <p className={s.verifyNote}>Couldn&apos;t verify access. Check your connection.</p>}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
