'use client';

import { Menu } from '@base-ui-components/react/menu';
import clsx from 'clsx';

import { EditIcon } from '@/components/icons';

// The product's menu chrome — the hardened base-ui Menu behind the home feed's
// share menu (portal, positioning, outside-press and Escape from the library),
// plus the local extras the job board's owner menu adds to it: the trigger's
// resting grey and the error-tone item. Same stylesheets as `ListingMenu`, so
// the two owner menus on a team profile are one object.
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';
import lm from '../job-board/ListingMenu.module.scss';
import { DeleteIcon } from '../job-board/icons';

import { DotsIcon } from './icons';

interface Props {
  /** The post's headline — the trigger's accessible name. */
  title: string;
  posterName: string;
  /** True when the reader is the poster: the heading says "you". */
  postedByViewer: boolean;
  onEdit: () => void;
  onRemove: () => void;
  className?: string;
}

/**
 * Everything an authorized person can do to a team-posted update, behind one ⋯.
 *
 * Rendered only for someone who may act (see `canManageTeamPost`); everyone
 * else gets no trigger, not a disabled one. The row keeps its reader's cluster
 * — share, views, likes, comments — because those are the story's numbers and
 * a poster reads their own post too; the two owner presses are rare and
 * secondary to opening the story, which is the definition of an overflow menu.
 * The forum's own post header does the same (`ItemMenu`: a dots trigger, Edit).
 *
 * The heading names who posted it. That is the one fact a lead or an admin
 * needs before removing something, and the one thing the card doesn't show:
 * the card is attributed to the team, on purpose.
 *
 * Edit opens the compose modal on this post; Remove hands off to the page's
 * confirm — the press that ends on a public feed asks first, the way every
 * other destroy in the product does.
 */
export function NewsPostMenu({ title, posterName, postedByViewer, onEdit, onRemove, className }: Props) {
  return (
    <Menu.Root modal={false}>
      {/* stopPropagation, as the share menu beside it does: the row is a button
          and nothing in here may reach it. */}
      <Menu.Trigger
        className={clsx(menu.iconTrigger, lm.trigger, className)}
        aria-label={`Actions for “${title}”`}
        onClick={(e) => e.stopPropagation()}
      >
        <DotsIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={menu.popup} onClick={(e) => e.stopPropagation()}>
            <div className={menu.popupTitle}>Posted by {postedByViewer ? 'you' : posterName}</div>
            <Menu.Item className={menu.item} onClick={onEdit}>
              <EditIcon width={14} height={14} />
              Edit
            </Menu.Item>
            <Menu.Item className={clsx(menu.item, lm.danger)} onClick={onRemove}>
              <DeleteIcon />
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
