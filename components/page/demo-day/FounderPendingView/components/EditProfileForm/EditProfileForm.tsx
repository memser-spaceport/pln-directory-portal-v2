import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import s from './EditProfileForm.module.scss';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';

interface EditProfileFormData {
  image: File | null;
  teamName: string;
  shortDescription: string;
  tags: string[];
  fundingStage: { value: string; label: string } | null;
}

interface Props {
  onClose: () => void;
  member?: IMember;
  userInfo?: IUserInfo;
}

// Mock funding stage options - replace with real data
const fundingStageOptions = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'series-c', label: 'Series C' },
  { value: 'growth', label: 'Growth' },
  { value: 'ipo', label: 'IPO' },
];

export const EditProfileForm = ({ onClose, member, userInfo }: Props) => {
  const methods = useForm<EditProfileFormData>({
    defaultValues: {
      image: null,
      teamName: 'Randamu', // Replace with actual data
      shortDescription: 'Randamu increases fairness in our world by harnessing entropy.',
      tags: ['VR/AR', 'Frontier Tech', 'Service Providers', 'Enterprise Solutions'],
      fundingStage: { value: 'seed', label: 'Seed' },
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: EditProfileFormData) => {
    console.log('Form submitted:', formData);
    // TODO: Implement actual form submission logic
    // - Upload image if changed
    // - Update profile data via API
    // - Handle success/error states

    // For now, just close the form (this will return to view mode)
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <EditFormControls onClose={onClose} title="Edit Profile Details" />
        <div className={s.body}>
          <div className={s.row}>
            <ProfileImageInput member={{ profile: '', name: 'Randamu' }} />
            <FormField name="name" label="Name" isRequired placeholder="Text" />
          </div>
          <div className={s.row}>
            <FormField name="shortDescription" label="Short Description" isRequired placeholder="Text" />
          </div>

          <div className={s.row}>
            <FormTagsInput name="tags" selectLabel="Tags" placeholder="Add tags (e.g., AI, Blockchain, FinTech)" />
          </div>

          <div className={s.row}>
            <FormSelect name="fundingStage" label="Funding Stage" placeholder="Select your current funding stage" options={fundingStageOptions} isRequired />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
