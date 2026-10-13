import { Badge } from '@/components/common/Badge';

import s from './InterestedBadge.module.scss';

/**
 * The mark on a suggestion from a member who said "I'm interested" in the role
 * or its team (LAB-2789). The DS `Badge` in its neutral tone, so it reads as a
 * fact about the person and never competes with the green and blue match bands.
 */
export function InterestedBadge() {
  return (
    <Badge variant="default" className={s.root}>
      Interested
    </Badge>
  );
}
