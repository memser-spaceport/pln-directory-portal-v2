import { cloneElement, isValidElement, ReactNode } from 'react';

import s from './SingleStat.module.scss';

interface Props {
  label: ReactNode;
  value?: number;
  icon: ReactNode;
}

export function SingleStat(props: Props) {
  const { label, value, icon } = props;

  if (!value) {
    return null;
  }

  return (
    <div className={s.root}>
      {isValidElement(icon) &&
        cloneElement(icon, {
          // @ts-ignore
          className: s.icon,
        })}

      <span>
        {value} {label}
      </span>
    </div>
  );
}
