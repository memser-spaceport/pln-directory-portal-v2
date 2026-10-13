'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import clsx from 'clsx';

import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { jobBoardShareUrl, jobDetailShareUrl } from '@/services/jobs/job-detail-link';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import type { IJobRole } from '@/types/jobs.types';

import { CheckIcon, LinkIcon } from '../ReferMenu/components/Icons';
/* The product's menu chrome. `ReferMenu`'s own note says a third share surface
   must extract from `NewsShareMenu` — the hardened base-ui Menu — rather than
   copy its hand-rolled popover again, so the portal, positioning, outside-press
   and Escape all come from the library, and its stylesheet is the popup and
   item every menu on a card here wears. */
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import { ChevronIcon, DotsIcon } from './Icons';
import s from './RoleOwnerMenu.module.scss';

/**
 * Where this listing came from — the menu's heading.
 *
 * The one fact an owner needs that an applicant never does: these rows are
 * ingested from a team's own careers site or ATS, and a lead looking at a row
 * they did not type wants to know which. The design puts it here, labelling the
 * actions it qualifies, rather than in the row's meta.
 *
 * Read off the posting URL because that IS the origin — production has no
 * `ListingOrigin` model, and inventing "Submitted by you" would name a route
 * (a team submitting a job in-app) that does not exist. Host only: the first
 * path segment is a slug or an id on every ATS this ingests from, and
 * "boards.greenhouse.io/primeintellect" is a heading that wraps.
 *
 * `null` when the posting has no URL, which is a real state — the ingest carries
 * roles whose source link it could not resolve. No heading beats a heading that
 * says nothing.
 */
export function describeListingOrigin(applyUrl: string | null | undefined): string | null {
  if (!applyUrl) return null;
  try {
    const { hostname } = new URL(applyUrl);
    return `From ${hostname.replace(/^www\./, '')}`;
  } catch {
    /* The ingest stores whatever the source gave it; a value that is not a URL
       is not something to render as one. */
    return null;
  }
}

interface RoleOwnerMenuProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  source: JobSurface;
  /** Opens the in-app drawer. Absent where the row has no flow. */
  onViewJob?: () => void;
  /** The company's own posting, for a row that links out instead. */
  postingHref?: string;
  /** Opens the row's Refer modal — the row owns it, this only asks. */
  onRefer: () => void;
}

/**
 * A team's own role row, with every press behind one ⋯.
 *
 * **The owner's row shows no actions at rest.** Refer, Share and the way into
 * the posting are what an applicant needs at a glance; to the lead who is
 * hiring for the role they are occasional, and three controls on every row of
 * their own team's profile is a cluster they read past. One icon, one list.
 *
 * **Three items, not five.** The design also draws `Mark inactive` /
 * `Bring back` and `Delete`, and neither is here: job openings are ingested
 * from a team's careers site, `IJobRole` carries no status field, and the API
 * has no team-side write for a listing at all — no status change, no delete,
 * no create. A menu item that takes a listing down without taking it down
 * would be a claim about what the public board shows, which is the false
 * promise this product has already had to remove once (see
 * `JobInterestBanner`'s copy rule). They arrive when the endpoints do.
 *
 * Share is a submenu of the same three intents the row's `ReferMenu` offers,
 * with the same destinations: the social intents point at the crawlable job
 * page, Copy link at the board deep link. Never the team's own posting —
 * whoever receives it should land on this role in the Directory.
 */
export function RoleOwnerMenu({ role, teamId, teamName, source, onViewJob, postingHref, onRefer }: RoleOwnerMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  /* Cleared on unmount: the row can leave (a filter, a role taken down, the
     section collapsing) between the copy and the reset, and a timer firing into
     an unmounted component is a React warning and a leak. `ReferMenu` does not
     do this, which is one of the things its note means by "hardened". */
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analytics = useJobsAnalytics();
  const origin = describeListingOrigin(role.applyUrl);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

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
    const url = jobDetailShareUrl(role.uid, network);
    const text = `Referring a great role - ${role.roleTitle} at ${teamName}. Know someone perfect for it?`;
    const encodedUrl = encodeURIComponent(url);
    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;

    analytics.onJobReferShared({ ...referBase, network });
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobBoardShareUrl(role.uid, 'copy_link'));
      analytics.onJobReferShared({ ...referBase, network: 'copy_link' });
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      setCopied(true);
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard is blocked in some contexts. Saying nothing is right: the link
         is still reachable from the row's own title. */
    }
  };

  return (
    <Menu.Root
      modal={false}
      open={open}
      onOpenChange={(next) => {
        if (next) analytics.onJobReferShareMenuOpened(referBase);
        setOpen(next);
      }}
    >
      {/* `stopPropagation` throughout: the row's title is a button and the row
          itself takes clicks, so nothing pressed in here may reach either. */}
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
            {origin && <div className={menu.popupTitle}>{origin}</div>}

            {/* The reader's presses first, in the order the row itself used. */}
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
                    {/* Stays open on press so "Link copied!" is legible where it
                        happened, rather than flashing as the menu closes. */}
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
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
