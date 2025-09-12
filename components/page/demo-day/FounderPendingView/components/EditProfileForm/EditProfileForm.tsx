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
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';

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
  const { data: profileData } = useGetFundraisingProfile();

  // Helper function to format funding stage for form
  const formatFundingStageForForm = (stage: string) => {
    const option = fundingStageOptions.find(opt => opt.value === stage);
    return option || null;
  };

  const methods = useForm<EditProfileFormData>({
    defaultValues: {
      image: null,
      teamName: profileData?.name || '',
      shortDescription: profileData?.shortDescription || '',
      tags: profileData?.tags || [],
      fundingStage: profileData?.fundingStage ? formatFundingStageForForm(profileData.fundingStage) : null,
    },
  });

  // Reset form when profile data changes
  React.useEffect(() => {
    if (profileData) {
      methods.reset({
        image: null,
        teamName: profileData.name || '',
        shortDescription: profileData.shortDescription || '',
        tags: profileData.tags || [],
        fundingStage: profileData.fundingStage ? formatFundingStageForForm(profileData.fundingStage) : null,
      });
    }
  }, [profileData, methods]);

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
            <ProfileImageInput
              member={{
                profile: profileData?.image || '',
                name: profileData?.name || 'Team Name'
              }}
            />
            <FormField name="teamName" label="Team Name" isRequired placeholder="Enter team name" />
          </div>
          <div className={s.row}>
            <FormTextArea
              name="shortDescription"
              label="Short Description"
              isRequired
              placeholder="Describe your team and what you do..."
              rows={3}
            />
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
