import clsx from 'clsx';
import type { EngagementTier } from '@/services/investors/types';
import { ENGAGEMENT_TIER_LABEL } from '@/services/investors/constants';
import s from './EngagementTierBadge.module.scss';

interface Props {
  tier: EngagementTier;
  compact?: boolean;
}

export function EngagementTierBadge({ tier, compact }: Props) {
  return (
    <span className={clsx(s.badge, s[tier], { [s.compact]: compact })} title={ENGAGEMENT_TIER_LABEL[tier]}>
      {compact ? tier.split('_')[0] : ENGAGEMENT_TIER_LABEL[tier]}
    </span>
  );
}
