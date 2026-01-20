import React, { ReactNode } from 'react';
import clsx from 'clsx';

import s from './Badge.module.scss';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClass = clsx({
    [s.default]: variant === 'default',
    [s.brand]: variant === 'brand',
    [s.success]: variant === 'success',
    [s.warning]: variant === 'warning',
    [s.error]: variant === 'error',
  });

  return <span className={clsx(s.root, variantClass, className)}>{children}</span>;
}
