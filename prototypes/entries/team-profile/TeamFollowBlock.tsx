'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, InfoCircleIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import { PrivacyNote } from '../follow-shared/PrivacyNote';
import type { TeamFollower } from './mocks';
import local from './TeamProfile.module.scss';

interface Props {
  count: number;
  followers: TeamFollower[];
  /** Inline layout: single row above the About section (vs. the header cluster). */
  inline?: boolean;
}

/**
 * Team-view followers block: the follower avatar stack + count, opening the
 * full-list modal (the list stays team-only). Public visitors get the Follow
 * pill in the header card's corner instead — rendered by the prototype page,
 * not this block.
 */
export function TeamFollowBlock({ count, followers, inline }: Props) {
  const [open, setOpen] = useState(false);
  const stack = followers.slice(0, 3);

  // Avatar stack + count + team-only eye; click opens the full list.
  const followersRow = (
    <div className={local.subStackRow}>
      <button type="button" className={local.subStack} onClick={() => setOpen(true)}>
        <span className={local.subAvatars} aria-hidden="true">
          {stack.map((sub) => (
            <img key={sub.id} className={local.subAvatar} src={sub.avatar} alt="" loading="lazy" />
          ))}
        </span>
        <span className={local.subCount}>
          <strong>{count.toLocaleString()}</strong> {count === 1 ? 'follower' : 'followers'}
        </span>
      </button>

      {/* The list (not the count) is team-only — the eye tells you why, note on hover. */}
      <CustomTooltip
        forceTooltip
        content={<span className={local.subPrivacyTip}>The follower list is only visible to your team.</span>}
        trigger={
          <span className={local.subPrivacyIcon} aria-label="The follower list is only visible to your team.">
            <InfoCircleIcon width={15} height={15} />
          </span>
        }
      />
    </div>
  );

  return (
    <div className={inline ? local.followInline : local.followHeader}>
      {inline ? <div className={local.inlineFollowers}>{followersRow}</div> : followersRow}

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
          {followers.map((sub) => (
            <li key={sub.id} className={local.subRow}>
              <img className={local.subRowAvatar} src={sub.avatar} alt="" loading="lazy" />
              <div className={local.subRowText}>
                <span className={local.subRowName}>{sub.name}</span>
                <span className={local.subRowRole}>{sub.role}</span>
              </div>
            </li>
          ))}
        </ul>
        <PrivacyNote>The follower list is only visible to your team.</PrivacyNote>
      </Modal>
    </div>
  );
}
