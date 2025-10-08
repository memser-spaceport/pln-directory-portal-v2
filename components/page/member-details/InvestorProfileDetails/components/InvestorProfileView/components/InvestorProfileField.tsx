import React from 'react';
import s from '../InvestorProfileView.module.scss';

interface Props {
  label: string;
  children?: React.ReactNode;
}

export const InvestorProfileField: React.FC<Props> = ({ label, children }) => {
  return (
    <div className={s.keywordsWrapper}>
      <span className={s.keywordsLabel}>{label}</span>
      <span className={s.badgesWrapper}>{children}</span>
    </div>
  );
};

