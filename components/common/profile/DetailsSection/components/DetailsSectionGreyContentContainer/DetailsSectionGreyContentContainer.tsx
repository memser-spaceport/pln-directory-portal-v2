import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import s from './DetailsSectionGreyContentContainer.module.scss'

interface Props {
  className?: string;
}

export function DetailsSectionGreyContentContainer(props: PropsWithChildren<Props>) {
  const { children, className } = props;

  return <div className={clsx(s.root, className)}>{children}</div>;
}
