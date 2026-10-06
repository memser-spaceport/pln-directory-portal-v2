'use client';

import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';

import { EditIcon, MenuIcon } from '@/components/icons';
// The forum comment row's own ⋯ menu — trigger, popup and items — by stylesheet.
import im from '@/components/page/forum/ItemMenu/ItemMenu.module.scss';
// The error-tone item the job board's owner menu adds to the product menu, and its bin.
import lm from '../../job-board/ListingMenu.module.scss';
import { DeleteIcon } from '../../job-board/icons';

import s from './CommentMenu.module.scss';

interface Props {
  /** What the menu acts on, for its accessible name ("comment", "reply"). */
  kind: 'comment' | 'reply';
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The ⋯ on your own comment or reply: Edit, Delete.
 *
 * The forum's comment rows already carry this ⋯ (production `ItemMenu`, Edit
 * only, shown to the comment's author and admins). It can't be imported as is —
 * it routes to the post editor and has no Delete — so this is its markup and
 * stylesheet with the second item added in the job board owner menu's error
 * tone. Shown only on what the viewer wrote; nobody else gets a disabled one.
 */
export function CommentMenu({ kind, onEdit, onDelete }: Props) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx(im.button, s.trigger)} aria-label={`Actions for your ${kind}`}>
        <div className={im.buttonIcon}>
          <MenuIcon color="#455468" />
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={clsx(im.positioner, s.positioner)} align="end">
          <Menu.Popup className={im.popup} onClick={(e) => e.stopPropagation()}>
            <Menu.Item className={im.item} onClick={onEdit}>
              <EditIcon color="#64748B" /> Edit
            </Menu.Item>
            <Menu.Item className={clsx(im.item, lm.danger)} onClick={onDelete}>
              <DeleteIcon /> Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
