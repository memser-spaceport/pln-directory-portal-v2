'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { jobDetailShareUrl } from '@/services/jobs/job-detail-link';
import type { IJobRole } from '@/types/jobs.types';
import {
  CheckIcon,
  LinkIcon,
  ShareIcon,
} from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/components/Icons';

// Production's popover styling 1:1.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/ReferMenu.module.scss';

interface JobShareMenuProps {
  role: IJobRole;
  teamName: string;
}

/** How long the menu survives the pointer leaving — enough to cross the gap
 *  between the icon and the popover. */
const HOVER_CLOSE_DELAY = 150;

/**
 * COPY of production `ReferMenu` (the role row's share icon) that also opens on
 * hover. Production only toggles on click.
 *
 * Hover is the preview, a click pins it: pressing the icon while the hover menu
 * is showing keeps it open rather than toggling it shut under the pointer. Touch
 * and keyboard, which have no hover, get the click alone. Analytics dropped —
 * the prototype is mocked end to end.
 */
export function JobShareMenu({ role, teamName }: JobShareMenuProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = hovered || pinned;

  const close = () => {
    setHovered(false);
    setPinned(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const onPointerEnter = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHovered(true);
  };

  const onPointerLeave = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    closeTimer.current = setTimeout(() => setHovered(false), HOVER_CLOSE_DELAY);
  };

  const share = (network: 'linkedin' | 'x') => {
    const url = jobDetailShareUrl(role.uid);
    const text = `Referring a great role - ${role.roleTitle} at ${teamName}. Know someone perfect for it?`;
    const encodedUrl = encodeURIComponent(url);
    const shareUrl =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodedUrl}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    close();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobDetailShareUrl(role.uid));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked in some contexts — no-op for the prototype
    }
  };

  /* Hover already opened it: the click commits rather than closing it. */
  const onTriggerClick = () => {
    if (hovered && !pinned) setPinned(true);
    else if (pinned) close();
    else setPinned(true);
  };

  return (
    <div className={s.wrap} ref={wrapRef} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <span
        className={s.trigger}
        role="button"
        tabIndex={0}
        aria-label="Share role"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onTriggerClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTriggerClick();
          }
        }}
      >
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
