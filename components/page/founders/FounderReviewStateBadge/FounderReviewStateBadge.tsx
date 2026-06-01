import clsx from 'clsx';
import type { FounderStatus } from '@/services/founders/types';
import { FOUNDER_STATUS_LABEL } from '@/services/founders/constants';
import s from './FounderReviewStateBadge.module.scss';

interface Props {
  status: FounderStatus;
  className?: string;
}

export function FounderReviewStateBadge({ status, className }: Props) {
  return (
    <span className={clsx(s.badge, s[status], className)}>
      {FOUNDER_STATUS_LABEL[status]}
    </span>
  );
}
