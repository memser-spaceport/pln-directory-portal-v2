import React, { PropsWithChildren } from 'react';

import s from './FilterSection.module.scss';

interface Props extends PropsWithChildren {
  title?: string;
  titleIcon?: React.ReactNode;
  description?: string;
}

export const FilterSection = ({ title, titleIcon, description, children }: Props) => {
  return (
    <div className={s.root}>
      {title && (
        <div className={s.header}>
          {title} {titleIcon}
        </div>
      )}

      <div className={s.body}>
        {description && <p className={s.description}>{description}</p>}
        {children}
      </div>
    </div>
  );
};
