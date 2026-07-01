'use client';

import { useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, InfoCircleIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import { FollowButton } from '../follow-shared/FollowButton';
import { FollowToast } from '../follow-shared/FollowToast';
import { PrivacyNote } from '../follow-shared/PrivacyNote';
import type { TeamSubscriber } from './mocks';
import local from './TeamProfile.module.scss';

interface Props {
  name: string;
  following: boolean;
  count: number;
  onToggle: () => void;
  view: 'public' | 'team';
  subscribers: TeamSubscriber[];
  /** Inline layout: Follow button + followers on a single row (no caption). */
  inline?: boolean;
}

/**
 * Follow block shown before the About section: the Follow button + a one-line
 * "why subscribe". In team view it also surfaces the subscriber avatar stack +
 * count, which opens a modal with the full subscriber list. Public view hides
 * all subscriber info.
 *
 * `inline` lays the button and followers side by side on one row (used by the
 * "Team (inline)" variant that sits above the About section).
 */
export function TeamFollowBlock({ name, following, count, onToggle, view, subscribers, inline }: Props) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stack = subscribers.slice(0, 3);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const handleFollow = () => {
    const willFollow = !following;
    onToggle();
    if (willFollow) {
      setToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(false), 4500);
    } else {
      setToast(false);
    }
  };

  // Followers avatar stack + count + team-only eye — shared by both layouts.
  const followersRow = (
    <div className={local.subStackRow}>
      <button
        type="button"
        className={`${local.subStack} ${view === 'team' ? '' : local.subStackHidden}`}
        onClick={() => view === 'team' && setOpen(true)}
        aria-hidden={view !== 'team'}
        tabIndex={view === 'team' ? 0 : -1}
      >
        <span className={local.subAvatars} aria-hidden="true">
          {stack.map((sub) => (
            <img key={sub.id} className={local.subAvatar} src={sub.avatar} alt="" loading="lazy" />
          ))}
        </span>
        <span className={local.subCount}>
          <strong>{count.toLocaleString()}</strong> {count === 1 ? 'follower' : 'followers'}
        </span>
      </button>

      {/* The count itself is team-only — the eye tells you why, note on hover. */}
      {view === 'team' && (
        <CustomTooltip
          forceTooltip
          content={<span className={local.subPrivacyTip}>Followers are only visible to your team.</span>}
          trigger={
            <span className={local.subPrivacyIcon} aria-label="Followers are only visible to your team.">
              <InfoCircleIcon width={15} height={15} />
            </span>
          }
        />
      )}
    </div>
  );

  // Toast + subscriber modal — identical across layouts.
  const overlays = (
    <>
      {toast && (
        <FollowToast>
          You&apos;re following <strong>{name}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}

      {view === 'team' && (
        <Modal isOpen={open} onClose={() => setOpen(false)} className={local.subModal}>
          <div className={local.subModalHead}>
            <span className={local.subModalTitleWrap}>
              <h3 className={local.subModalTitle}>Followers</h3>
              <span className={local.subModalCount}>{count.toLocaleString()}</span>
            </span>
            <button type="button" className={local.subModalClose} onClick={() => setOpen(false)} aria-label="Close">
              <CloseIcon width={20} height={20} />
            </button>
          </div>
          <ul className={local.subList}>
            {subscribers.map((sub) => (
              <li key={sub.id} className={local.subRow}>
                <img className={local.subRowAvatar} src={sub.avatar} alt="" loading="lazy" />
                <div className={local.subRowText}>
                  <span className={local.subRowName}>{sub.name}</span>
                  <span className={local.subRowRole}>{sub.role}</span>
                </div>
              </li>
            ))}
          </ul>
          <PrivacyNote>Followers are only visible to your team.</PrivacyNote>
        </Modal>
      )}
    </>
  );

  // Inline: compact Follow button + followers on one row (above About).
  if (inline) {
    return (
      <div className={local.followInline}>
        {/* Button + caption stacked on the left; followers to the right. */}
        <div className={local.inlineFollowCol}>
          <span className={local.inlineFollowBtn}>
            <FollowButton following={following} onClick={handleFollow} name={name} size="s" bell block glossy />
          </span>
          {!following && <p className={local.inlineCaption}>Subscribe for updates</p>}
        </div>
        {/* Public view hides all subscriber info — show only the button + caption.
            Wrapped in a button-height box so followers center to the button, not
            the taller button+caption column. */}
        {view === 'team' && <div className={local.inlineFollowers}>{followersRow}</div>}
        {overlays}
      </div>
    );
  }

  // Default: vertical cluster (button + caption stacked, followers beneath).
  return (
    <div className={local.followHeader}>
      {/* Button + caption grouped so the button fills the caption's width. The
          caption is always rendered (hidden once following) so the button width
          stays constant across states. */}
      <div className={local.followTop}>
        <FollowButton following={following} onClick={handleFollow} name={name} size="s" bell block glossy />
        <p className={`${local.followCaption} ${following ? local.followCaptionHidden : ''}`}>Subscribe for updates</p>
      </div>

      {followersRow}
      {overlays}
    </div>
  );
}
