'use client';

import type { FounderItem } from '@/services/founders/types';
import s from './FounderSignalBadges.module.scss';

type Props = {
  founder: Pick<
    FounderItem,
    'isRaising' | 'isCofounderSearch' | 'isComingOutOfStealth' | 'nearNetwork' | 'plAligned' | 'rawPayload'
  >;
};

function flag(
  topLevel: boolean | null | undefined,
  rawKey: keyof NonNullable<FounderItem['rawPayload']>,
  raw: FounderItem['rawPayload'],
): boolean {
  if (topLevel === true) return true;
  return raw?.[rawKey] === true;
}

export function FounderSignalBadges({ founder }: Props) {
  const badges: string[] = [];
  const raw = founder.rawPayload;

  if (flag(founder.isRaising, 'is_raising', raw)) badges.push('Raising');
  if (flag(founder.isCofounderSearch, 'is_cofounder_search', raw)) badges.push('Cofounder search');
  if (flag(founder.isComingOutOfStealth, 'is_coming_out_of_stealth', raw)) badges.push('Stealth');
  if (flag(founder.nearNetwork, 'near_network', raw)) badges.push('Near network');
  if (flag(founder.plAligned, 'pl_aligned', raw)) badges.push('PL-aligned');

  if (badges.length === 0) return null;

  return (
    <div className={s.row}>
      {badges.map((label) => (
        <span key={label} className={s.badge}>
          {label}
        </span>
      ))}
    </div>
  );
}
