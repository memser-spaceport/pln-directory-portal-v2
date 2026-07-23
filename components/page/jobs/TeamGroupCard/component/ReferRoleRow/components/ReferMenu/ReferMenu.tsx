'use client';

import { useEffect, useRef, useState } from 'react';

import type { IJobRole } from '@/types/jobs.types';
import { Button } from '@/components/common/Button';

import { getShareText } from './utils/getShareText';

import { LinkIcon, CheckIcon } from './components/Icons';

import s from './ReferMenu.module.scss';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

interface ReferMenuProps {
  role: IJobRole;
  teamName: string;
}

/**
 * Prototype-only "Refer" control on each job row: a small popover that shares the
 * role to LinkedIn or X via each platform's web share-intent URL, or copies the
 * role link. Uses the mocked applyUrl as the shared link (falls back to the page).
 *
 * NOTE: TeamNews's NewsShareMenu is the hardened adaptation of this component
 * (base-ui Menu, encoded intents, cleared copy timer) — a third share surface
 * should extract from there, not copy this one again.
 */
export function ReferMenu({ role, teamName }: ReferMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const getJobLink = () => {
    const { applyUrl } = role;

    if (applyUrl) {
      return `${applyUrl}?${JOB_QUERY_PARAMS}`;
    }

    return typeof window !== 'undefined' ? window.location.href : '';
  };

  const share = (network: 'linkedin' | 'x') => {
    const url = getJobLink();
    const text = getShareText(role, teamName);

    const encodedUrl = encodeURIComponent(url);

    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=640');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJobLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked in some contexts — no-op for the prototype
    }
  };

  return (
    <div className={s.wrap} ref={wrapRef}>
      <Button
        style="border"
        variant="secondary"
        size="xs"
        className={s.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Refer
      </Button>

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
