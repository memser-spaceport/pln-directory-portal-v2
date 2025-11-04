import React from 'react';
import { SecRulesCheckbox } from './SecRulesCheckbox';
import { AngelInvestmentFields } from './AngelInvestmentFields';
import { CommunicationsLink } from './CommunicationsLink';
import s from '../EditInvestorProfileForm.module.scss';

interface Props {
  secRulesAccepted: boolean;
  onSecRulesChange: (checked: boolean) => void;
  onTrigger: () => void;
  fundingStageOptions: { label: string; value: string }[];
  showSectionHeader?: boolean;
}

export const AngelInvestorSection: React.FC<Props> = ({
  secRulesAccepted,
  onSecRulesChange,
  onTrigger,
  fundingStageOptions,
  showSectionHeader = true,
}) => {
  return (
    <>
      {showSectionHeader && (
        <div className={s.sectionHeader}>
          <h3>Your Angel Investor Profile</h3>
        </div>
      )}

      <SecRulesCheckbox checked={secRulesAccepted} onChange={onSecRulesChange} onTrigger={onTrigger} />

      {secRulesAccepted && (
        <>
          <AngelInvestmentFields fundingStageOptions={fundingStageOptions} />
          <CommunicationsLink />
        </>
      )}
    </>
  );
};
