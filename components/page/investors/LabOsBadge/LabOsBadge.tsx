import Link from 'next/link';
import clsx from 'clsx';
import type { LabOsProfileRef } from '@/services/investors/types';
import s from './LabOsBadge.module.scss';

interface Props {
  profile: LabOsProfileRef | null;
  variant?: 'icon' | 'chip' | 'full';
  className?: string;
}

/**
 * Indicates that this investor has a LabOS profile (member or fund team).
 * Renders as a clickable link to the profile when present, nothing when null.
 */
export function LabOsBadge({ profile, variant = 'chip', className }: Props) {
  if (!profile) return null;
  const href = profile.type === 'member' ? `/members/${profile.uid}` : `/teams/${profile.uid}`;
  const label = profile.type === 'member' ? 'In LabOS' : 'Fund in LabOS';

  if (variant === 'icon') {
    const tooltip = profile.type === 'member'
      ? `${profile.name} — open LabOS member profile`
      : `${profile.name} — open LabOS fund profile`;
    return (
      <Link
        href={href}
        className={clsx(s.arrowLink, className)}
        title={tooltip}
        aria-label={tooltip}
        onClick={(e) => e.stopPropagation()}
      >
        ↗
      </Link>
    );
  }

  if (variant === 'full') {
    return (
      <Link href={href} className={clsx(s.full, className)} onClick={(e) => e.stopPropagation()}>
        <span className={s.dot} aria-hidden />
        <span className={s.full__name}>{profile.name}</span>
        <span className={s.full__type}>{profile.type === 'member' ? 'Member profile' : 'Fund profile'}</span>
        <span className={s.full__arrow}>↗</span>
      </Link>
    );
  }

  return (
    <Link href={href} className={clsx(s.chip, className)} title={`Open ${profile.name} in LabOS`} onClick={(e) => e.stopPropagation()}>
      <span className={s.dot} aria-hidden />
      {label}
    </Link>
  );
}
