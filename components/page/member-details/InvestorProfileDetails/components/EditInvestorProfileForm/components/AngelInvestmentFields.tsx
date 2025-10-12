import React from 'react';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import s from '../EditInvestorProfileForm.module.scss';

interface Props {
  fundingStageOptions: { label: string; value: string }[];
}

export const AngelInvestmentFields: React.FC<Props> = ({ fundingStageOptions }) => {
  return (
    <>
      <div className={s.row}>
        <FormMultiSelect
          name="investInStartupStages"
          label="Startup stage(s) you invest in?"
          placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
          options={fundingStageOptions}
          showNone
          isRequired
        />
      </div>
      <div className={s.row}>
        <FormCurrencyField
          name="typicalCheckSize"
          label="Typical Check Size"
          placeholder="E.g. $250.000"
          currency="USD"
          isRequired
        />
      </div>
      <div className={s.row}>
        <FormTagsInput
          selectLabel="Add Investment Focus"
          name="investmentFocusAreas"
          placeholder="Add keywords E.g. AI, Staking, Governance, etc."
        />
      </div>
    </>
  );
};
