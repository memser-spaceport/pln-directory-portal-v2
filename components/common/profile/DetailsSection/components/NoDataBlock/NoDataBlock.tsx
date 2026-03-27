import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import s from './NoDataBlock.module.scss';

interface Props {
  className?: string;
}

export function NoDataBlock(props: PropsWithChildren<Props>) {
  const { children, className } = props;

  return <span className={clsx(s.root, className)}>{children}</span>;
}
