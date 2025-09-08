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

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

// Mock check size options
const checkSizeOptions = [
  { label: '$1K - $5K', value: '$1K - $5K' },
  { label: '$5K - $10K', value: '$5K - $10K' },
  { label: '$10K - $25K', value: '$10K - $25K' },
  { label: '$25K - $50K', value: '$25K - $50K' },
  { label: '$50K - $100K', value: '$50K - $100K' },
  { label: '$100K - $250K', value: '$100K - $250K' },
  { label: '$250K - $500K', value: '$250K - $500K' },
  { label: '$500K - $1M', value: '$500K - $1M' },
  { label: '$1M+', value: '$1M+' },
];

export const EditInvestorProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();

  const schema = yup.object().shape({
    typicalCheckSize: yup.string().defined().nullable(),
    investmentFocusAreas: yup.array().of(yup.string().defined()).defined().nullable(),
    displayAsInvestor: yup.boolean().defined(),
  });

  const methods = useForm<TEditInvestorProfileForm>({
    defaultValues: {
      typicalCheckSize: (member as any)?.typicalCheckSize || '',
      investmentFocusAreas: (member as any)?.investmentFocusAreas || [],
      displayAsInvestor: (member as any)?.displayAsInvestor || false,
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
            <FormSelect
              name="typicalCheckSize"
              label="Typical Check Size"
              placeholder="Select typical check size"
              options={checkSizeOptions}
            />
          </div>
          <div className={s.row}>
            <FormTagsInput 
              selectLabel="Investment Focus Areas:" 
              name="investmentFocusAreas" 
              warning={false} 
              placeholder="Add focus areas (e.g. Web3, AI, Fintech, etc.)" 
            />
          </div>
          <div className={s.row}>
            <FormSwitch
              name="displayAsInvestor"
              label="Display my profile as an Investor (for Demo Days & fundraising)"
            />
          </div>
        </div>
        <EditOfficeHoursMobileControls />
      </form>
    </FormProvider>
  );
};
