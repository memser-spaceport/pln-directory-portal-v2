import clsx from 'clsx';
import React from 'react';

import s from './InvestorProfileField.module.scss';

interface Props {
  label: string;
  children?: React.ReactNode;
  classes?: {
    root?: string;
    label?: string;
    content?: string;
  };
}

export const InvestorProfileField: React.FC<Props> = (props) => {
  const { label, classes, children } = props;

  return (
    <div className={clsx(s.keywordsWrapper, classes?.root)}>
      <span className={clsx(s.keywordsLabel, classes?.label)}>{label}</span>
      <span className={clsx(s.badgesWrapper, classes?.content)}>{children}</span>
    </div>
  );
};
