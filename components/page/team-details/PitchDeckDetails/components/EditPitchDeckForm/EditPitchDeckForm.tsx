import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { IUserInfo } from '@/types/shared.types';
import {
  TEditInvestorProfileForm,
  TEditInvestorProfileFormTeam,
} from '@/components/page/member-details/InvestorProfileDetails/types';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import { EditOfficeHoursMobileControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursMobileControls';
import * as yup from 'yup';

import s from './EditPitchDeckForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { ITeam } from '@/types/teams.types';

interface Props {
  onClose: () => void;
  team: ITeam;
  userInfo: IUserInfo;
}

const schema = yup.object().shape({
  typicalCheckSize: yup.string().required('Required'),
  investmentFocusAreas: yup.array().of(yup.string().required()).min(1, 'Required').defined(),
  displayAsInvestor: yup.boolean().defined(),
});

export const EditPitchDeckForm = ({ onClose, team, userInfo }: Props) => {
  const router = useRouter();

  const methods = useForm<TEditInvestorProfileFormTeam>({
    defaultValues: {},
    resolver: yupResolver(schema),
    mode: 'all',
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: TEditInvestorProfileFormTeam) => {
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
          <div className={s.row}>content???</div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
