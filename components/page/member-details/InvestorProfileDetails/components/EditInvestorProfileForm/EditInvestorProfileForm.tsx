import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { FormSwitch } from '@/components/form/FormSwitch';
import { ADMIN_ROLE } from '@/utils/constants';
import * as yup from 'yup';

import s from './EditInvestorProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

// Mock check size options
const checkSizeOptions = [
  { label: '0 - 100.000', value: '0 - 100.000' },
  { label: '100.000 - 500.000', value: '100.000 - 500.000' },
  { label: '500.000 - 1.000.000', value: '500.000 - 1.000.000' },
  { label: '1.000.000 - 2.000.000', value: '1.000.000 - 2.000.000' },
  { label: '2.000.000 - 5.000.000', value: '2.000.000 - 5.000.000' },
];

const schema = yup.object().shape({
  typicalCheckSize: yup.object().test({
    test: function (value) {
      if (!value) {
        return this.createError({ message: 'Required', type: 'required' });
      }

      return true;
    },
  }),
  investmentFocusAreas: yup.object().test({
    test: function (value) {
      if (!value) {
        return this.createError({ message: 'Required', type: 'required' });
      }

      return true;
    },
  }),
});

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      typicalCheckSize: (member as any)?.typicalCheckSize || '',
      investmentFocusAreas: (member as any)?.investmentFocusAreas || [],
    },
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const isAdmin = !!(userInfo && userInfo.roles?.includes(ADMIN_ROLE));
  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: TEditInvestorProfileForm) => {
    // Mock mutation - replace with actual API call
    console.log('Submitting investor profile data:', formData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success response
    toast.success('Investor profile updated successfully!');
    router.refresh();
    reset();
    onClose();
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
            <FormSelect name="typicalCheckSize" label="Typical Check Size" placeholder="Select typical check size" options={checkSizeOptions} />
          </div>
          <div className={s.row}>
            <FormMultiSelect label="Add Investment Focus Area" name="investmentFocusAreas" placeholder="Select focus area" options={[]} />
          </div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
