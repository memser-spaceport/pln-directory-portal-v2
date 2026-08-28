'use client';

import { useEffect, useRef, useState } from 'react';

import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import { jobDetailShareUrl } from '@/services/jobs/job-detail-link';
import type { IJobRole } from '@/types/jobs.types';

import { LinkIcon, CheckIcon, ShareIcon } from './components/Icons';

import s from './ReferMenu.module.scss';

interface ReferMenuProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  source: JobSurface;
}

/**
 * Share control on each job row: LinkedIn / X intents, or copy link.
 *
 * Always shares the in-app drawer deep link (`/jobs?job=<uid>`), never the
 * company's own posting — recipients should land on the board with that role
 * open, the same destination refer/apply emails now send.
 *
 * NOTE: TeamNews's NewsShareMenu is the hardened adaptation of this component
 * (base-ui Menu, encoded intents, cleared copy timer) — a third share surface
 * should extract from there, not copy this one again.
 */
export function ReferMenu({ role, teamId, teamName, source }: ReferMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const analytics = useJobsAnalytics();

  const referBase = {
    job_id: role.uid,
    team_id: teamId,
    team_name: teamName,
    role_title: role.roleTitle,
    role_category: role.roleCategory,
    seniority: role.seniority,
    source,
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const getJobLink = () => jobDetailShareUrl(role.uid);

  const share = (network: 'linkedin' | 'x') => {
    const url = getJobLink();
    const text = `Referring a great role - ${role.roleTitle} at ${teamName}. Know someone perfect for it?`;

    const encodedUrl = encodeURIComponent(url);

    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;

    analytics.onJobReferShared({ ...referBase, network });
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJobLink());
      analytics.onJobReferShared({ ...referBase, network: 'copy_link' });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked in some contexts — no-op for the prototype
    }
  };

  const toggleMenu = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) analytics.onJobReferShareMenuOpened(referBase);
      return !wasOpen;
    });
  };

  return (
    <div className={s.wrap} ref={wrapRef}>
      <span className={s.trigger} aria-haspopup="menu" aria-expanded={open} onClick={toggleMenu}>
        <ShareIcon />
      </span>

      {open && (
        <div className={s.popover} role="menu">
          <p className={s.popoverTitle}>Refer someone</p>
          <button type="button" className={s.item} role="menuitem" onClick={() => share('linkedin')}>
            <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden="true" />
            Share on LinkedIn
          </button>
          <button type="button" className={s.item} role="menuitem" onClick={() => share('x')}>
            <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden="true" />
            Share on X
          </button>
          <button
            type="button"
            className={`${s.item} ${copied ? s.itemCopied : ''}`}
            role="menuitem"
            onClick={copyLink}
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
