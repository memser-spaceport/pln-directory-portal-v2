'use client';

import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

import s from './SettingsMenuItem.module.scss';

export type onItemClick = (url: string, name: string) => void;

export type ISettingsMenuItem = {
  name: string;
  url: string;
  icon: string;
  activeIcon: string;
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
      <p className={s.text}>{item.name}</p>
      <img className={s.arrow} width="12" height="12" alt="arrow right" src="/icons/arrow-right.svg" />
    </div>
  );
}
