'use client';

import { useEffect, useRef, useState } from 'react';

import type { IJobRole } from '@/types/jobs.types';
import { Button } from '@/components/common/Button/Button';

import s from './ReferMenu.module.scss';

interface ReferMenuProps {
  role: IJobRole;
  teamName: string;
}

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function shareText(role: IJobRole, teamName: string): string {
  const seniority = role.seniority ? `${role.seniority.replace(/\s*\(.*\)\s*/, '').trim()} ` : '';
  return `Referring a great role — ${seniority}${role.roleTitle} at ${teamName}. Know someone perfect for it?`;
}

/**
 * Prototype-only "Refer" control on each job row: a small popover that shares the
 * role to LinkedIn or X via each platform's web share-intent URL, or copies the
 * role link. Uses the mocked applyUrl as the shared link (falls back to the page).
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

  const linkFor = () => role.applyUrl ?? (typeof window !== 'undefined' ? window.location.href : '');

  const share = (network: 'linkedin' | 'x') => {
    const url = linkFor();
    const text = shareText(role, teamName);
    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=640');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkFor());
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
