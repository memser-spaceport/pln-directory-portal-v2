'use client';

import React from 'react';
import s from './PitchInvestorHeader.module.scss';

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

export function ProfileWhileYouWait({ isComplete, onClick }: { isComplete: boolean; onClick: () => void }) {
  const phrase = isComplete ? 'Update your investor profile' : 'Set up your investor profile';

  return (
    <>
      <InvestorProfileInlineLink onClick={onClick}>{phrase}</InvestorProfileInlineLink> while you wait.
    </>
  );
}

export function CompleteProfileBeforeMaterials({ onClick }: { onClick: () => void }) {
  return (
    <>
      <InvestorProfileInlineLink onClick={onClick}>Complete your investor profile</InvestorProfileInlineLink> before
      reviewing materials.
    </>
  );
}
