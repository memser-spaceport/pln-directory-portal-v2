'use client';

import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

import { Badge } from '@/components/common/Badge';

import s from './SettingsMenuItem.module.scss';

export type onItemClick = (url: string, name: string) => void;

export type ISettingsMenuItem = {
  name: string;
  url: string;
  icon: string;
  activeIcon: string;
  /** Shows a "New" badge after the name (MCP connections, LAB-2995). */
  isNew?: boolean;
};

interface SettingsMenuItemProps {
  item: ISettingsMenuItem;
  onClick: onItemClick;
}

export function SettingsMenuItem({ item, onClick }: SettingsMenuItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

  return (
    <div onClick={() => onClick(item.url, item.name)} className={clsx(s.root, { [s.active]: isActive })}>
      <img width="16" height="16" alt={item.name} src={isActive ? item.activeIcon : item.icon} />
      <p className={clsx(s.text, { [s.textTight]: item.isNew })}>{item.name}</p>
      {item.isNew && (
        <Badge variant="brand" className={s.newBadge}>
          New
        </Badge>
      )}
      <img className={s.arrow} width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
    </div>
  );
}
