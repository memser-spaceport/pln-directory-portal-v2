'use client';

import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { MenuIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import s from './AppActionsMenu.module.scss';

/**
 * A matched 16px stroke set, local to this menu. The shared icon library has
 * no gear or trash, and its two nearest icons disagree on style (EditIcon is
 * a solid fill, DocumentIcon a 1.2px outline) — mixing them would read as two
 * different sets in one menu. These inherit `currentColor`, so the
 * destructive item tints its icon for free.
 */
const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11.06 2.94a1.5 1.5 0 0 1 2.12 2.12l-7.42 7.42-2.83.71.71-2.83 7.42-7.42Z" />
      <path d="M10.25 3.75l2.12 2.12" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M5 7l1.8 1.8L5 10.6" />
      <path d="M8.8 10.6h2.4" />
    </svg>
  );
}

/**
 * A log file: a document carrying text lines. The shared DocumentIcon is the
 * same silhouette without the lines, which is what keeps the two apart.
 */
function LogFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 2h4.7L12.5 5.3V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M9 2v3.5h3.5" />
      <path d="M5.9 8.9h4.2M5.9 11h2.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 4.5h10" />
      <path d="M6.5 4.5v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1" />
      <path d="M4.6 4.5l.55 8a1 1 0 0 0 1 .93h3.7a1 1 0 0 0 1-.93l.55-8" />
      <path d="M6.8 7v3.8M9.2 7v3.8" />
    </svg>
  );
}

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

  // Gated here, not in the parents, so grid and detail page can't drift:
  // a DRAFT has never built, so it has no logs to show.
  const showLogsItem = app.status !== 'DRAFT';

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
              <PencilIcon />
              Edit details
            </Menu.Item>
            <Menu.Item className={s.item} disabled={verifying} onClick={onDeployment}>
              <TerminalIcon />
              Deployment settings
            </Menu.Item>
            {showLogsItem && (
              <Menu.Item className={s.item} disabled={verifying} onClick={onLogs}>
                <LogFileIcon />
                Deployment logs
              </Menu.Item>
            )}
            <div className={s.divider} role="separator" />
            <Menu.Item className={`${s.item} ${s.destructive}`} disabled={verifying} onClick={onDelete}>
              <TrashIcon />
              Delete app
            </Menu.Item>
            {verifyFailed && <p className={s.verifyNote}>Couldn&apos;t verify access. Check your connection.</p>}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
