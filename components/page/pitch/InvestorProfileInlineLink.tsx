'use client';

import React from 'react';
import s from './PitchSpotlightHero.module.scss';

type Props = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export function InvestorProfileInlineLink({ onClick, children, className }: Props) {
  return (
    <button type="button" className={className ?? s.inlineLink} onClick={onClick}>
      {children}
    </button>
  );
}
