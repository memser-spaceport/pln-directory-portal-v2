import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/form/FormField';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { Button } from '@/components/common/Button';

import s from './AddTeamInlineForm.module.scss';
import { CloseIcon } from '@/components/core/UpdatesPanel/IrlGatheringModal/icons';

export interface InvestorFieldsConfig {
  fundingStageOptions: { label: string; value: string }[];
  fundTypeOptions: { label: string; value: string }[];
}

export interface AddTeamInlineFormFieldNames {
  role: string;
  name: string;
  website: string;
  startupStages?: string;
  typicalCheckSize?: string;
  investmentFocusAreas?: string;
  fundTypes?: string;
}

export interface AddTeamInlineFormProps {
  onClose: () => void;
  title?: string;
  description?: string;
  showInvestorFields?: boolean;
  investorFieldsConfig?: InvestorFieldsConfig;
  fieldNames: AddTeamInlineFormFieldNames;
}

export const AddTeamInlineForm = ({
  onClose,
  title = 'Add Your Role & Team',
  description = "Enter your team's details below.",
  showInvestorFields = false,
  investorFieldsConfig,
  fieldNames,
}: AddTeamInlineFormProps) => {
  const { setValue, watch } = useFormContext();

  const ensureProtocol = () => {
    const val = (watch(fieldNames.website) as string)?.trim();
    if (val && !/^https?:\/\//i.test(val)) {
      setValue(fieldNames.website, `https://${val}`, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleClose = () => {
    setValue(fieldNames.name, '', { shouldValidate: true });
    setValue(fieldNames.website, '', { shouldValidate: true });
    setValue(fieldNames.role, '', { shouldValidate: true });
    onClose();
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h3 className={s.title}>{title}</h3>
          <p className={s.description}>{description}</p>
        </div>
        <Button variant="secondary" type="button" className={s.closeButton} onClick={handleClose}>
          <CloseIcon />
        </Button>
      </div>
      <div className={s.separator} />
      <div className={s.body}>
        <FormField
          name={fieldNames.name}
          placeholder="Enter team name"
          label="Team Name"
          isRequired
          rules={{ required: 'Team name is required' }}
          onClear={() => {
            setValue(fieldNames.name, '', { shouldValidate: true, shouldDirty: true });
          }}
        />

        <FormField
          name={fieldNames.website}
          placeholder="Enter website address"
          label="Website Address"
          description="Paste a URL (LinkedIn, company website, etc.)"
          isRequired
          rules={{ required: 'Website is required' }}
          onBlur={() => ensureProtocol()}
        />

        <FormField
          name={fieldNames.role}
          placeholder="Enter your primary role"
          label="Role"
          isRequired
          rules={{ required: 'Role is required' }}
        />

        {showInvestorFields && investorFieldsConfig && fieldNames.startupStages && fieldNames.typicalCheckSize && (
          <>
            <FormMultiSelect
              name={fieldNames.startupStages}
              label="Startup stage(s) you invest in?"
              placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A...)"
              options={investorFieldsConfig.fundingStageOptions}
              isRequired
            />
            <FormCurrencyField
              name={fieldNames.typicalCheckSize}
              label="Typical Check Size"
              placeholder="Add check size"
              currency="USD"
              isRequired
            />
            {fieldNames.investmentFocusAreas && (
              <FormTagsInput
                selectLabel="Add Investment Focus"
                name={fieldNames.investmentFocusAreas}
                placeholder="Add keywords. E.g. AI, Staking, Governance, etc."
              />
            )}
            {fieldNames.fundTypes && (
              <FormMultiSelect
                name={fieldNames.fundTypes}
                label="Type of fund(s) you invest in?"
                placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
                options={investorFieldsConfig.fundTypeOptions}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
