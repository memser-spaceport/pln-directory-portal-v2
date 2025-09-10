import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import * as yup from 'yup';

import s from './EditInvestorProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useUpdateInvestorProfile } from '@/services/members/hooks/useUpdateInvestorProfile';
import { FormCurrencyField } from '@/components/form/FormCurrencyField';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

const schema = yup.object().shape({
  typicalCheckSize: yup.string().required('Required'),
  investmentFocusAreas: yup.array().of(yup.string().required()).min(1, 'Required').defined(),
});

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const updateInvestorProfileMutation = useUpdateInvestorProfile();

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      typicalCheckSize: member.investorProfile?.typicalCheckSize || '',
      investmentFocusAreas: member.investorProfile?.investmentFocus || [],
    },
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: TEditInvestorProfileForm) => {
    try {
      const payload = {
        investorProfile: {
          investmentFocus: formData.investmentFocusAreas,
          typicalCheckSize: formData.typicalCheckSize,
        },
      };

      await updateInvestorProfileMutation.mutateAsync({ memberUid: member.id, payload });

      toast.success('Investor profile updated successfully!');
      router.refresh();
      reset();
      onClose();
    } catch (error) {
      console.error('Error updating investor profile:', error);
      toast.error('Failed to update investor profile. Please try again.');
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        noValidate
      >
        <EditOfficeHoursFormControls onClose={onClose} title="Edit Investor Profile" />
        <div className={s.body}>
          <div className={s.row}>
            <FormCurrencyField name="typicalCheckSize" label="Typical Check Size" placeholder="Enter typical check size" currency="USD" />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="Add Investment Focus Area" name="investmentFocusAreas" placeholder="Enter focus area" />
          </div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
