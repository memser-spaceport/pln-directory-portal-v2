'use client';

import clsx from 'clsx';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { useCurrentUserStore } from '@/services/auth/store';
import { Badge } from '@/components/common/Badge';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import type { AccessBadgeContent } from '../../types/accessBadges';

import s from './AccessBadge.module.scss';

interface Props {
  badge: AccessBadgeContent;
  className?: string;
}

export function AccessBadge(props: Props) {
  const { badge, className } = props;
  const currentUser = useCurrentUserStore((state) => state.currentUser);

  if (!isAdminUser(currentUser)) {
    return null;
  }

  const { label, description, variant } = badge;

  return (
    <Tooltip
      asChild
      side="top"
      trigger={
        <span className={clsx(s.trigger, className)}>
          <Badge variant={variant} className={s.badge}>
            {label}
          </Badge>
        </span>
      }
      content={description}
    />
  );
}
