'use client';

import type { ReactNode } from 'react';

import { LockIcon } from '@/components/icons';

import s from './VisibilityPill.module.scss';

// The label renders uppercase, so it takes no full stop. The icon only decorates the label: a lock alone
// reads as "you don't have access" elsewhere in the product.
interface Props {
  className?: string;
  label?: string;
  icon?: ReactNode;
}

export function VisibilityPill(props: Props) {
  const { className, label = 'Only visible to you', icon = <LockIcon /> } = props;

  return (
    <span className={className ? `${s.pill} ${className}` : s.pill}>
      {icon}
      {label}
    </span>
  );
}
