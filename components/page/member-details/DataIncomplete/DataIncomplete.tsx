import { clsx } from 'clsx';
import React, { PropsWithChildren, ReactNode } from 'react';

import { InfoCircleIconOutlined } from '@/components/icons';

import s from './DataIncomplete.module.scss';

interface Props {
  icon?: ReactNode;
  className?: string;
}

export function DataIncomplete(props: PropsWithChildren<Props>) {
  const { icon, children, className } = props;

  return (
    <div className={clsx(s.root, className)}>
      {icon || <InfoCircleIconOutlined />} {children}
    </div>
  );
}
