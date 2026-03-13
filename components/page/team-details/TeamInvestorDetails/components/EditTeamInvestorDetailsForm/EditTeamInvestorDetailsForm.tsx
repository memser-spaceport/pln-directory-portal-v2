'use client';

import Link from 'next/link';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { useMemo } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import {
  InfoIcon,
  LinkIcon,
} from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import { formatNumberToCurrency } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/utils';
import { useUpdateTeamInvestorProfile } from '@/services/teams/hooks/useUpdateTeamInvestorProfile';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { ITeam } from '@/types/teams.types';

import { editTeamInvestorDetailsSchema, parseCurrencyToNumber, TOption, TTeamInvestorDetailsForm } from './helpers';

import s from './EditTeamInvestorDetailsForm.module.scss';

interface Props {
  team: ITeam;
  onClose: () => void;
}

const FUND_TYPE_OPTIONS: TOption[] = [
  { label: 'Early stage', value: 'Early stage' },
  { label: 'Late stage', value: 'Late stage' },
  { label: 'Fund-of-funds', value: 'Fund-of-funds' },
  { label: 'Growth', value: 'Growth' },
];

export const EditTeamInvestorDetailsForm = ({ team, onClose }: Props) => {
  const router = useRouter();
  const { data: options } = useTeamsFormOptions();
  const updateTeamInvestorProfileMutation = useUpdateTeamInvestorProfile();

  const fundingStageOptions = useMemo(
    () => [
      ...(options?.fundingStage
        ?.filter(
          (item: { name: string }) =>
            item.name !== 'Not Applicable' && item.name !== 'Series D' && item.name !== 'Series E' && item.name !== 'None',
        )
        .map((item: { name: string }) => ({ label: item.name, value: item.name })) || []),
      { label: 'Series D and later', value: 'Series D and later' },
    ],
    [options?.fundingStage],
  );

  const methods = useForm<TTeamInvestorDetailsForm>({
    defaultValues: {
      investInStartupStages:
        team?.investorProfile?.investInStartupStages?.map((item) => ({ label: item, value: item })) || [],
      typicalCheckSize: formatNumberToCurrency(team?.investorProfile?.typicalCheckSize) || '',
      investmentFocusAreas: team?.investorProfile?.investmentFocus || [],
      investInFundTypes: team?.investorProfile?.investInFundTypes?.map((item) => ({ label: item, value: item })) || [],
    },
    resolver: yupResolver(editTeamInvestorDetailsSchema),
    mode: 'onSubmit',
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: TTeamInvestorDetailsForm) => {
    try {
      await updateTeamInvestorProfileMutation.mutateAsync({
        teamUid: team.id,
        payload: {
          isFund: true,
          investorProfile: {
            investmentFocus: formData.investmentFocusAreas,
            investInStartupStages: formData.investInStartupStages.map((item) => item.value),
            investInFundTypes: formData.investInFundTypes.map((item) => item.value),
            typicalCheckSize: parseCurrencyToNumber(formData.typicalCheckSize),
          },
        },
      });

      toast.success('Fund details updated successfully');
      reset(formData);
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Failed to update fund details', error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form className={s.form} onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Fund Details" onClose={onClose} />

        <div className={s.panel}>
          <div className={s.row}>
            <FormMultiSelect
              name="investInStartupStages"
              label="Startup stage(s) you invest in?"
              placeholder="Select startup stages (e.g., Pre-seed, Seed, Series A…)"
              options={fundingStageOptions}
              isRequired
            />
          </div>

          <div className={s.row}>
            <FormCurrencyField
              name="typicalCheckSize"
              label="Typical Check Size"
              placeholder="Add check size"
              currency="USD"
              isRequired
            />
          </div>

          <div className={s.row}>
            <FormTagsInput
              selectLabel="Add Investment Focus"
              name="investmentFocusAreas"
              placeholder="Add keywords. E.g. AI, Staking, Governance, etc."
            />
          </div>

          <div className={s.row}>
            <FormMultiSelect
              name="investInFundTypes"
              label="Type of fund(s) you invest in?"
              placeholder="Select fund types (e.g., Early stage, Late stage, Fund-of-funds)"
              options={FUND_TYPE_OPTIONS}
            />
          </div>

          <div className={s.infoBox}>
            <div className={s.infoIcon}>
              <InfoIcon />
            </div>

            <div className={s.infoContent}>
              <div className={s.infoTitle}>Manage your investor settings</div>
              <p className={s.infoText}>Update demo day invites and investor profile visibility in Account Settings →</p>
              <Link href="/settings/email" target="_blank" className={s.infoLink}>
                Email Preferences <LinkIcon />
              </Link>
            </div>
          </div>
        </div>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
