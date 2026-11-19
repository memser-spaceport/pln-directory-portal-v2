import type { MemberState } from '../types/accessBadges';
import { JOB_ASPIRANT_BADGE, MEMBER_STATE_BADGES } from '../constants/accessBadges';

import { AccessBadge } from '../components/AccessBadge';

interface Props {
  state?: MemberState;
  isJobAspirant?: boolean;
  className?: string;
}

export function MemberAccessBadges(props: Props) {
  const { state, isJobAspirant, className } = props;
  const stateBadge = state && MEMBER_STATE_BADGES[state];

  return (
    <>
      {stateBadge && <AccessBadge badge={stateBadge} className={className} />}
      {isJobAspirant && <AccessBadge badge={JOB_ASPIRANT_BADGE} className={className} />}
    </>
  );
}
