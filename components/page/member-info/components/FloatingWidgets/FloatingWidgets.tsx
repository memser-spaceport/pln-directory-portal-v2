import React, { PropsWithChildren } from 'react';

import s from './FloatingWidgets.module.scss';
import { clsx } from 'clsx';

interface Props extends PropsWithChildren {
  className?: string;
}

export const FloatingWidgets = ({ children, className }: Props) => {
  return <div className={clsx(s.root, className)}>{children}</div>;
};
