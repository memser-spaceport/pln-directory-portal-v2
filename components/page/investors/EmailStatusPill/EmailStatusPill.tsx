import clsx from 'clsx';
import { EMAIL_STATUS_LABEL } from '@/services/investors/constants';
import type { EmailStatus } from '@/services/investors/types';
import s from './EmailStatusPill.module.scss';

interface Props {
  status: EmailStatus;
}

export function EmailStatusPill({ status }: Props) {
  return (
    <span className={clsx(s.pill, s[status])} title={`Email ${EMAIL_STATUS_LABEL[status]}`}>
      {EMAIL_STATUS_LABEL[status]}
    </span>
  );
}
