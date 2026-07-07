'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { FormSwitch } from '@/components/form/FormSwitch';
import { CheckIcon, ChevronDownIcon, InfoCircleIcon, UsersThreeIcon } from '@/components/icons';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import { FollowButton } from './FollowButton';
import { defaultPrefValues, prefsFor, type FollowableKind } from './types';
import s from './FollowControl.module.scss';

export interface SocialProof {
  /** A couple of named followers the viewer knows. */
  names: string[];
  /** How many more, beyond the named ones. */
  moreCount: number;
  /** Small avatars of named followers, shown before the text. */
  avatars?: string[];
}

interface Props {
  name: string;
  kind: FollowableKind;
  following: boolean;
  count: number;
  onToggle: () => void;
  size?: 'xs' | 's' | 'm';
  /** Horizontal alignment of the stacked elements. */
  align?: 'start' | 'end';
  /** Full-width button (for cards). */
  block?: boolean;
  /** Network social proof shown under the button. */
  socialProof?: SocialProof;
  /** Group the follower count + action into one bordered pill (header-inline use). */
  grouped?: boolean;
  /** Show a bell icon on the not-following button. */
  bell?: boolean;
  /** Show an info icon with a tooltip explaining what following notifies you about. */
  info?: boolean;
}

/**
 * The follow affordance for a profile. Not-following → one tap to follow.
 * Following → a "Following ▾" button that opens a tap-friendly menu
 * (notification settings / mute / unfollow) — works on touch, and keeps the
 * destructive unfollow behind an explicit choice instead of a hover state.
 */
export function FollowControl({
  name,
  kind,
  following,
  count,
  onToggle,
  size = 's',
  align = 'end',
  block,
  socialProof,
  grouped,
  bell,
  info,
}: Props) {
  const prefsList = prefsFor(kind);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prefs = prefsFor(kind);
  const methods = useForm({ defaultValues: defaultPrefValues(kind) });

  // Dismiss the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleClick = () => {
    if (following) setMenuOpen((o) => !o);
    else onToggle();
  };

  return (
    <div className={clsx(s.root, { [s.alignStart]: align === 'start', [s.block]: block })}>
      <div className={s.buttonWrap} ref={wrapRef}>
        {grouped ? (
          // Workable-style: follower count + Follow action share one bordered pill.
          <div className={s.groupRow}>
            <div className={clsx(s.group, { [s.groupFollowing]: following })}>
              <span className={s.groupCount}>
                <UsersThreeIcon width={15} height={15} aria-hidden="true" />
                <span className={s.groupCountNum} key={count}>
                  {count.toLocaleString()}
                </span>
              </span>
              <button
                type="button"
                className={s.groupAction}
                onClick={handleClick}
                aria-haspopup={following ? 'menu' : undefined}
                aria-expanded={following ? menuOpen : undefined}
                aria-label={following ? `Following ${name}` : `Follow ${name}`}
              >
                {following && <CheckIcon width={14} height={14} aria-hidden="true" />}
                {following ? 'Following' : 'Follow'}
                {following && <ChevronDownIcon width={14} height={14} aria-hidden="true" />}
              </button>
            </div>
            {info && (
              <CustomTooltip
                trigger={
                  <span className={s.infoBtn} aria-label="What you'll be notified about">
                    <InfoCircleIcon width={16} height={16} />
                  </span>
                }
                content={
                  <span className={s.infoTip}>
                    Following notifies you about: {prefsList.map((p) => p.label.toLowerCase()).join(', ')}.
                  </span>
                }
              />
            )}
          </div>
        ) : (
          <FollowButton
            following={following}
            onClick={handleClick}
            count={count}
            name={name}
            size={size}
            block={block}
            caret
            bell={bell}
            menuExpanded={menuOpen}
          />
        )}

        {menuOpen && following && (
          <div className={clsx(s.menu, { [s.menuStart]: align === 'start' })} role="menu">
            <button
              type="button"
              role="menuitem"
              className={s.menuItem}
              onClick={() => {
                setPrefsOpen(true);
                setMenuOpen(false);
              }}
            >
              Notification settings
            </button>
            <button
              type="button"
              role="menuitem"
              className={s.menuItem}
              onClick={() => {
                setMuted((m) => !m);
                setMenuOpen(false);
              }}
            >
              {muted ? 'Unmute updates' : 'Mute updates'}
            </button>
            <div className={s.menuSep} aria-hidden="true" />
            <button
              type="button"
              role="menuitem"
              className={clsx(s.menuItem, s.menuDanger)}
              onClick={() => {
                onToggle();
                setMenuOpen(false);
              }}
            >
              Unfollow
            </button>
          </div>
        )}
      </div>

      {socialProof && socialProof.names.length > 0 && (
        <p className={s.proof}>
          {socialProof.avatars && socialProof.avatars.length > 0 && (
            <span className={s.proofAvatars} aria-hidden="true">
              {socialProof.avatars.map((src, i) => (
                <img key={i} className={s.proofAvatar} src={src} alt="" loading="lazy" />
              ))}
            </span>
          )}
          {grouped ? (
            <span>{socialProof.moreCount} in your network following</span>
          ) : (
            <span>
              <strong>{socialProof.names.join(', ')}</strong>
              {socialProof.moreCount > 0 && ` +${socialProof.moreCount}`} in your network
            </span>
          )}
        </p>
      )}

      <Modal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} className={s.modal}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>What you hear about</h3>
          <p className={s.modalLede}>
            You&apos;re following {name}. Choose what shows up in your feed and notifications.
          </p>
        </div>
        <FormProvider {...methods}>
          <div className={s.toggles}>
            {prefs.map((p) => (
              <FormSwitch key={p.key} name={p.key} label={p.label} helperText={p.helper} />
            ))}
          </div>
        </FormProvider>
        <div className={s.modalFoot}>
          <button type="button" className={s.doneBtn} onClick={() => setPrefsOpen(false)}>
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
