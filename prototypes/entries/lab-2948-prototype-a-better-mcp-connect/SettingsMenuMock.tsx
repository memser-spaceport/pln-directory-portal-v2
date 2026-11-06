'use client';

import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';
// Production classes, reused so the rail tracks production's look.
import menuCss from '@/components/page/settings/SettingsMenu/SettingsMenu.module.scss';
import groupCss from '@/components/page/settings/SettingsMenu/components/SettingsMenuGroup/SettingsMenuGroup.module.scss';
import itemCss from '@/components/page/settings/SettingsMenu/components/SettingsMenuGroup/components/SettingsMenuItem/SettingsMenuItem.module.scss';

import s from './McpSectionMock.module.scss';

/**
 * COPY-SIMPLIFY of production's `SettingsMenu` (components/page/settings/SettingsMenu).
 * Production reads the member's notification settings over the network, tracks clicks and
 * routes by pathname; here the items are static and only the agents tab is built.
 * The items and their order are production's `useGetMenuItems` without
 * "recommendations" (shown only when the member has it on), plus the new
 * "MCP connections" tab under Account (2026-10-26: MCP gets its own sub-tab).
 * Its "New" badge is the first discovery surface: it stays until the member
 * opens the tab once.
 */
const ACCOUNT = [
  { name: 'email & accounts', icon: '/icons/email.svg', activeIcon: '/icons/email-blue.svg', isNew: false },
  { name: 'MCP connections', icon: '/icons/link-gray.svg', activeIcon: '/icons/link-blue.svg', isNew: true },
];

const PREFERENCES = [
  { name: 'notification preferences', icon: '/icons/bell.svg', activeIcon: '/icons/bell-blue.svg', isNew: false },
  { name: 'job preferences', icon: '/icons/briefcase.svg', activeIcon: '/icons/briefcase-blue.svg', isNew: false },
  { name: 'general preferences', icon: '/icons/settings.svg', activeIcon: '/icons/settings-blue.svg', isNew: false },
];

type Item = (typeof ACCOUNT)[number];

export const BUILT_ITEM = 'MCP connections';

export function SettingsMenuMock({
  activeItem,
  seen,
  onSelect,
}: {
  activeItem: string;
  /** The member has opened the tab, so its New badge is gone. */
  seen: boolean;
  onSelect: (name: string) => void;
}) {
  const renderItem = (item: Item) => {
    const isActive = item.name === activeItem;
    const isBuilt = item.name === BUILT_ITEM;
    return (
      <div
        key={item.name}
        onClick={isBuilt ? () => onSelect(item.name) : undefined}
        title={isBuilt ? undefined : 'Not part of this prototype'}
        aria-disabled={!isBuilt}
        className={clsx(itemCss.root, { [itemCss.active]: isActive })}
        style={isBuilt ? undefined : { cursor: 'default' }}
      >
        <img width="16" height="16" alt={item.name} src={isActive ? item.activeIcon : item.icon} />
        <p className={clsx(itemCss.text, { [s.railText]: item.isNew })}>{item.name}</p>
        {item.isNew && !seen && (
          <Badge variant="brand" className={s.railBadge}>
            New
          </Badge>
        )}
        <img className={itemCss.arrow} width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
      </div>
    );
  };

  return (
    <div className={menuCss.root}>
      <div className={groupCss.root}>
        <h3 className={groupCss.title}>Account</h3>
        <div className={groupCss.list}>{ACCOUNT.map(renderItem)}</div>
      </div>
      <div className={groupCss.root}>
        <h3 className={groupCss.title}>Preferences</h3>
        <div className={groupCss.list}>{PREFERENCES.map(renderItem)}</div>
      </div>
    </div>
  );
}
