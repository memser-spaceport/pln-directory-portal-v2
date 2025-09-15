import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTagsInput } from '@/components/form/FormTagsInput';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import s from './EditProfileForm.module.scss';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { useUpdateFundraisingProfile } from '@/services/demo-day/hooks/useUpdateFundraisingProfile';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { saveRegistrationImage } from '@/services/registration.service';
import { toast } from 'react-toastify';

interface EditProfileFormData {
  image: File | null;
  name: string;
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

const schema = yup.object().shape({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().required('Name is required'),
  shortDescription: yup.string().required('Short description is required'),
  tags: yup.array().of(yup.string().defined()).min(1, 'At least one tag is required').defined().required('Tags are required'),
  fundingStage: yup
    .object()
    .shape({
      value: yup.string().required('Funding stage is required'),
      label: yup.string().required('Funding stage is required'),
    })
    .nullable(),
});

export const EditProfileForm = ({ onClose, member, userInfo }: Props) => {
  const { data: profileData } = useGetFundraisingProfile();
  const updateProfileMutation = useUpdateFundraisingProfile();

  // Helper function to format funding stage for form
  const formatFundingStageForForm = (stage: string) => {
    const option = fundingStageOptions.find((opt) => opt.value === stage);
    return option || null;
  };

  const methods = useForm<EditProfileFormData>({
    defaultValues: {
      image: null,
      name: profileData?.team?.name || '',
      shortDescription: profileData?.team?.shortDescription || '',
      tags: profileData?.team?.industryTags?.map((tag) => tag.title) || [],
      fundingStage: profileData?.team?.fundingStage ? formatFundingStageForForm(profileData.team.fundingStage.uid) : null,
    },
    resolver: yupResolver(schema),
  });

  // Reset form when profile data changes
  React.useEffect(() => {
    if (profileData) {
      methods.reset({
        image: null,
        name: profileData.team?.name || '',
        shortDescription: profileData.team?.shortDescription || '',
        tags: profileData.team?.industryTags?.map((tag) => tag.title) || [],
        fundingStage: profileData.team?.fundingStage ? formatFundingStageForForm(profileData.team.fundingStage.uid) : null,
      });
    }
  }, [profileData, methods]);

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: EditProfileFormData) => {
    try {
      let imageUrl = '';

      if (formData.image) {
        const imgResponse = await saveRegistrationImage(formData.image);
        imageUrl = imgResponse?.image.url;
      }

      const updateData = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        industryTags: formData.tags,
        fundingStage: formData.fundingStage?.value || '',
        logo: imageUrl,
      };

      await updateProfileMutation.mutateAsync(updateData);

      reset();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
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
                profile: profileData?.team?.logo?.url || '',
                name: profileData?.team?.name || 'Team Name',
              }}
            />
            <FormField name="name" label="Team Name" placeholder="Enter team name" />
          </div>
          <div className={s.row}>
            <FormField name="shortDescription" label="Short Description" placeholder="Describe your team and what you do..." />
          </div>

          <div className={s.row}>
            <FormTagsInput name="tags" selectLabel="Tags" placeholder="Add tags (e.g., AI, Blockchain, FinTech)" />
          </div>

          <div className={s.row}>
            <FormSelect name="fundingStage" label="Funding Stage" placeholder="Select your current funding stage" options={fundingStageOptions} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
