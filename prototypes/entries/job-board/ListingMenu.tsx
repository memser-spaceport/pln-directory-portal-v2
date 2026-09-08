'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import clsx from 'clsx';

import type { IJobRole } from '@/types/jobs.types';
import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { jobDetailShareUrl } from '@/services/jobs/job-detail-link';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { CheckIcon, LinkIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/components/Icons';

// The product's menu chrome: `NewsShareMenu` is the hardened base-ui Menu the
// jobs ReferMenu's own note says to extract from — portal, positioning,
// outside-press and Escape all come from the library, and its stylesheet is
// the popup, item and icon-trigger every menu on a card here wears.
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import { describeOrigin, type ListingMeta, type ListingStatus } from './listings';
import { DeleteIcon } from './icons';
import s from './ListingMenu.module.scss';

interface Props {
  meta: ListingMeta;
  role: IJobRole;
  teamId: string;
  teamName: string;
  source: JobSurface;
  /** Opens the in-app drawer (the board). Absent on a surface with no flow. */
  onViewJob?: () => void;
  /** The team's own posting, for a surface whose row links out (the profile). */
  postingHref?: string;
  onRefer: () => void;
  onSetStatus: (status: ListingStatus) => void;
  /** Opens the row's confirm; the deletion itself happens there. */
  onDelete: () => void;
}

/**
 * Everything you can do to a listing you own, behind one ⋯ at the end of the row.
 *
 * **The owner's row shows no actions at rest.** A lead's own listing renders
 * on the board with the same title, meta and clock as everyone's — plus a
 * status pill once it is not live — and every press, the reader's included,
 * sits in this menu. Apply / View job, Refer and Share are what an applicant
 * needs at a glance; to the person who posted the role they are occasional,
 * and three controls beside a ⋯ that holds two more is a row wearing two
 * clusters. One icon, one list, with the owner's own presses at the bottom.
 *
 * The menu's heading is where the listing came from — "From fil.org/careers",
 * "Submitted by you" — the one fact an owner needs that an applicant never
 * does, and the fact the open question about the inactive control turns on
 * (see `ListingOrigin`). It used to be a line under the row's meta; here it
 * labels the actions it qualifies.
 *
 * Share is a submenu holding the share popover's own three intents, share
 * logic transcribed from production's `ReferMenu` (the in-app deep link,
 * never the team's posting). `Mark inactive` / `Bring back` by state, nothing
 * to switch while in review; `Delete` in the error tone, last. The switch
 * acts at once — its undo is the item it turns into — and Delete hands off to
 * the row's confirm, because it has no undo.
 */
export function ListingMenu({
  meta,
  role,
  teamId,
  teamName,
  source,
  onViewJob,
  postingHref,
  onRefer,
  onSetStatus,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analytics = useJobsAnalytics();

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const referBase = {
    job_id: role.uid,
    team_id: teamId,
    team_name: teamName,
    role_title: role.roleTitle,
    role_category: role.roleCategory,
    seniority: role.seniority,
    source,
  };

  const share = (network: 'linkedin' | 'x') => {
    const encodedUrl = encodeURIComponent(jobDetailShareUrl(role.uid));
    const text = `Referring a great role - ${role.roleTitle} at ${teamName}. Know someone perfect for it?`;
    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;
    analytics.onJobReferShared({ ...referBase, network });
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobDetailShareUrl(role.uid));
      analytics.onJobReferShared({ ...referBase, network: 'copy_link' });
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      setCopied(true);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked in some contexts — no-op for the prototype
    }
  };

  return (
    <Menu.Root modal={false} open={open} onOpenChange={setOpen}>
      {/* stopPropagation, as the share menu does: the row's title is a button
          and nothing in here may reach it. */}
      <Menu.Trigger
        className={clsx(menu.iconTrigger, s.trigger)}
        aria-label={`Actions for ${role.roleTitle}`}
        onClick={(e) => e.stopPropagation()}
      >
        <DotsIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className={menu.popup} onClick={(e) => e.stopPropagation()}>
            <div className={menu.popupTitle}>{describeOrigin(meta.origin)}</div>

            {/* The reader's presses, in the row's own order. */}
            {onViewJob ? (
              <Menu.Item className={menu.item} onClick={onViewJob}>
                View job
              </Menu.Item>
            ) : postingHref ? (
              <Menu.Item
                className={menu.item}
                render={<a href={postingHref} target="_blank" rel="noopener noreferrer" />}
              >
                View posting
                <ArrowUpRightIcon aria-hidden="true" />
              </Menu.Item>
            ) : null}
            <Menu.Item className={menu.item} onClick={onRefer}>
              Refer
            </Menu.Item>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={clsx(menu.item, s.submenuTrigger)}>
                Share
                <ChevronIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner className={menu.positioner} side="right" align="start" sideOffset={4}>
                  <Menu.Popup className={menu.popup}>
                    <Menu.Item className={menu.item} onClick={() => share('linkedin')}>
                      <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden="true" />
                      Share on LinkedIn
                    </Menu.Item>
                    <Menu.Item className={menu.item} onClick={() => share('x')}>
                      <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden="true" />
                      Share on X
                    </Menu.Item>
                    <Menu.Item
                      className={clsx(menu.item, copied && menu.itemCopied)}
                      closeOnClick={false}
                      onClick={copyLink}
                    >
                      {copied ? <CheckIcon /> : <LinkIcon />}
                      {copied ? 'Link copied!' : 'Copy link'}
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            {/* The owner's presses, below a rule: the ones nobody else has. */}
            <div className={s.separator} role="separator" />
            {meta.status === 'live' && (
              <Menu.Item className={menu.item} onClick={() => onSetStatus('inactive')}>
                Mark inactive
              </Menu.Item>
            )}
            {meta.status === 'inactive' && (
              <Menu.Item className={menu.item} onClick={() => onSetStatus('live')}>
                Bring back
              </Menu.Item>
            )}
            <Menu.Item className={clsx(menu.item, s.danger)} onClick={onDelete}>
              <DeleteIcon />
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Three dots. The product has no horizontal-ellipsis glyph of its own (its
 *  "More" is a four-square grid, a nav mark), so this is the plainest one:
 *  three 1.5px discs, the dot `DemoDayInfoRow` draws, in a row. */
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

/** A submenu's chevron, at the menu's own stroke. */
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
