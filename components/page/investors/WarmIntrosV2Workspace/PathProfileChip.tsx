'use client';

import Image from 'next/image';
import s from './PathProfileChip.module.scss';

interface Props {
  name: string;
  profileUid: string;
  imageUrl?: string | null;
  onOpen: (profileUid: string) => void;
  /** When true, render a static chip (e.g. Protocol Labs org hop) . */
  nonInteractive?: boolean;
  /** When set, show a Directory-member indicator dot. */
  memberUid?: string | null;
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Clickable person chip used in table path column + investor drawer hop chain.
 * Pass nonInteractive for org stubs (Protocol Labs) that have no MasterProfile.
 */
export function PathProfileChip({
  name,
  profileUid,
  imageUrl,
  onOpen,
  nonInteractive = false,
  memberUid = null,
}: Props) {
  const label = name.trim() || profileUid || 'Unknown';
  const initials = initialsFromName(label);
  const src = imageUrl?.trim() || null;
  const inDirectory = Boolean(memberUid?.trim());

  const inner = (
    <>
      <span className={s.avatarWrap}>
        {src ? (
          <Image className={s.avatarImg} src={src} alt="" width={20} height={20} unoptimized />
        ) : (
          <span className={s.avatar} aria-hidden>
            {initials || '?'}
          </span>
        )}
        {inDirectory ? <span className={s.directoryDot} title="In LabOS" aria-label="In LabOS" /> : null}
      </span>
      <span className={s.label}>{label}</span>
    </>
  );

  if (nonInteractive) {
    return (
      <span className={`${s.chip} ${s.chipStatic}`} aria-label={label}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={s.chip}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(profileUid);
      }}
      aria-label={`Open profile for ${label}`}
    >
      {inner}
    </button>
  );
}
