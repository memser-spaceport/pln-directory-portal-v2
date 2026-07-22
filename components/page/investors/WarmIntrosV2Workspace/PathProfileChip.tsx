'use client';

import Image from 'next/image';
import s from './PathProfileChip.module.scss';

interface Props {
  name: string;
  profileUid: string;
  imageUrl?: string | null;
  onOpen: (profileUid: string) => void;
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
 */
export function PathProfileChip({ name, profileUid, imageUrl, onOpen }: Props) {
  const label = name.trim() || profileUid;
  const initials = initialsFromName(label);
  const src = imageUrl?.trim() || null;

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
      {src ? (
        <Image className={s.avatarImg} src={src} alt="" width={20} height={20} unoptimized />
      ) : (
        <span className={s.avatar} aria-hidden>
          {initials || '?'}
        </span>
      )}
      <span className={s.label}>{label}</span>
    </button>
  );
}
