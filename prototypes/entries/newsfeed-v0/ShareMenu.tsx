'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { ShareIcon } from './ForumIcons';

// Reuse the forum ReferMenu popover styling 1:1 (wrap / popover / item / title).
import rs from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/ReferMenu.module.scss';
import fa from './FeedActions.module.scss';
import local from './ShareMenu.module.scss';

interface Props {
  /** Link to share (falls back to the current page). */
  url?: string;
  /** 'modal' → the DS bordered Share button (opens upward); 'card' → the quiet meta-row link. */
  variant: 'modal' | 'card';
  /** Which edge the menu aligns to (default 'right'). Use 'left' when the trigger sits on the left of a clipped container. */
  align?: 'left' | 'right';
}

/**
 * Share control with a destination menu (Share on LinkedIn / X / Copy link) —
 * the conventional pattern, vs. a bare Share-that-copies. Modeled on the app's
 * `ReferMenu`: click-outside + Escape to close, web share-intent URLs, and a
 * clipboard copy with a "copied" flash.
 */
export function ShareMenu({ url, variant, align = 'right' }: Props) {
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

  const link = () => url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const share = (network: 'linkedin' | 'x') => {
    const u = encodeURIComponent(link());
    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
        : `https://twitter.com/intent/tweet?url=${u}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=640');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op for the prototype */
    }
  };

  return (
    <div className={rs.wrap} ref={wrapRef} onClick={(e) => e.stopPropagation()}>
      {/* Both variants use the quiet forum meta-item styling so Share sits at the
          same weight as Like/Comment. The modal has room for the "Share" label;
          the card stays icon-only. */}
      <button
        type="button"
        className={clsx(fa.subItem, fa.button)}
        aria-label="Share"
        title="Share"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ShareIcon />
        {variant === 'modal' && 'Share'}
      </button>

      {open && (
        <div className={clsx(rs.popover, variant === 'modal' && local.up, align === 'left' && local.alignLeft)} role="menu">
          <p className={rs.popoverTitle}>Share</p>
          <button type="button" className={rs.item} role="menuitem" onClick={() => share('linkedin')}>
            <img src="/icons/social-linkedin.svg" alt="" width={18} height={18} aria-hidden />
            Share on LinkedIn
          </button>
          <button type="button" className={rs.item} role="menuitem" onClick={() => share('x')}>
            <img src="/icons/social-x.svg" alt="" width={18} height={18} aria-hidden />
            Share on X
          </button>
          <button
            type="button"
            className={clsx(rs.item, copied && rs.itemCopied)}
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

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M8.5 11.5a3 3 0 0 0 4.24 0l2.3-2.3a3 3 0 1 0-4.24-4.24l-1.1 1.1M11.5 8.5a3 3 0 0 0-4.24 0l-2.3 2.3a3 3 0 1 0 4.24 4.24l1.1-1.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M16.5 6 8.25 14.25 4.5 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
