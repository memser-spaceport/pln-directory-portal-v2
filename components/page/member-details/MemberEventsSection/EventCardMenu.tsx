'use client';

import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';

import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import s from './OwnerControls.module.scss';

/**
 * The owner's ⋯ menu on an upcoming card (LAB-3218), the prototype's `RowMenu`: "Edit details" and "Remove". The hide
 * option went with LAB-3234. Base UI's menu gives it arrow keys, Escape and focus return. Only rendered for an owner
 * with the write permission: both items are writes the API refuses otherwise.
 */
export function EventCardMenu({
  eventName,
  onEdit,
  onRemove,
}: {
  eventName: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={menu.iconTrigger} aria-label={`Actions for ${eventName}`}>
        <DotsIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={menu.popup}>
            <Menu.Item className={menu.item} onClick={onEdit}>
              Edit details
            </Menu.Item>
            <Menu.Item className={clsx(menu.item, s.menuDanger)} onClick={onRemove}>
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
);
