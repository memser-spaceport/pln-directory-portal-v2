import clsx from 'clsx';

import s from './AiSearchIcon.module.scss';

interface AiSearchIconProps {
  size?: number;
  className?: string;
}

/** The product's AI mark (the Ask AI glyph). Decorative: the label beside it names the action. */
export function AiSearchIcon({ size = 20, className }: AiSearchIconProps) {
  return <span aria-hidden="true" className={clsx(s.icon, className)} style={{ width: size, height: size }} />;
}
