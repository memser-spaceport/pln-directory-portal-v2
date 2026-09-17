import clsx from 'clsx';

import s from './AiSearchIcon.module.scss';

interface AiSearchIconProps {
  size?: number;
  className?: string;
}

export function AiSearchIcon({ size = 20, className }: AiSearchIconProps) {
  return <span aria-hidden="true" className={clsx(s.icon, className)} style={{ width: size, height: size }} />;
}
