'use client';

import { useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal';

import { FollowButton } from '../follow-shared/FollowButton';
import { FollowToast } from '../follow-shared/FollowToast';
import type { TeamSubscriber } from './mocks';
import local from './TeamProfile.module.scss';

interface Props {
  name: string;
  following: boolean;
  count: number;
  onToggle: () => void;
  view: 'public' | 'team';
  subscribers: TeamSubscriber[];
}

/**
 * Follow block shown before the About section: the Follow button + a one-line
 * "why subscribe". In team view it also surfaces the subscriber avatar stack +
 * count, which opens a modal with the full subscriber list. Public view hides
 * all subscriber info.
 */
export function TeamFollowBlock({ name, following, count, onToggle, view, subscribers }: Props) {
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

  return (
    <div className={local.followHeader}>
      {/* Button on top so it never jumps when the caption/followers below change. */}
      <FollowButton following={following} onClick={handleFollow} name={name} size="s" bell block glossy />
      {/* Not following: caption between button and followers. Following: caption
          gone so the followers sit right under the button — a bottom spacer
          (below) reserves its height so the About section never jumps. */}
      {!following && <p className={local.followCaption}>Subscribe for updates</p>}

      {/* Always rendered (hidden in public) so its height is reserved and the
          About section below sits in the same place across public/team views. */}
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

      {/* Reserves the caption's height once following so About stays in place. */}
      {following && <div className={local.captionSpacer} aria-hidden="true" />}

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
              <CloseIcon />
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
        </Modal>
      )}
    </div>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
