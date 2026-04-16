import * as yup from 'yup';
import Cookies from 'js-cookie';
import React, { useEffect, useMemo } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { toast } from '@/components/core/ToastContainer';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { useGetFundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { useUpdateFundraisingProfile } from '@/services/demo-day/hooks/useUpdateFundraisingProfile';
import { FundraisingProfile } from '@/services/demo-day/hooks/useGetFundraisingProfile';
import { saveRegistrationImage } from '@/services/registration.service';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { getParsedValue } from '@/utils/common.utils';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import { IndustryFundingOpts } from './type';
import { getFormDataFromProfile } from './utils/getFormDataFromProfile';

import s from './EditProfileForm.module.scss';

interface EditProfileFormData {
  image: File | null;
  name: string;
  shortDescription: string;
  tags: { value: string; label: string }[];
  fundingStage: { value: string; label: string } | null;
  website: string;
  program: { value: string; label: string } | null;
}

interface Props {
  onClose: (saved?: boolean) => void;
  member?: IMember;
  userInfo?: IUserInfo;
  profileData?: FundraisingProfile;
}

const schema = yup.object().shape({
  image: yup.mixed<File>().nullable().defined(),
  name: yup.string().required('Name is required').max(50, 'Name should not exceed 50 characters'),
  shortDescription: yup
    .string()
    .required('Short description is required')
    .max(100, 'Short description should not exceed 100 characters'),
  tags: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          value: yup.string().required('Company Stage is required'),
          label: yup.string().required('Company Stage is required'),
        })
        .defined(),
    )
    .min(1, 'At least one tag is required')
    .defined()
    .required('Tags are required'),
  fundingStage: yup
    .object()
    .shape({
      value: yup.string().required('Company Stage is required'),
      label: yup.string().required('Company Stage is required'),
    })
    .nullable(),
  website: yup.string().defined(),
  program: yup
    .object()
    .shape({
      value: yup.string().required(),
      label: yup.string().required(),
    })
    .nullable(),
});

export const EditProfileForm = ({ onClose, profileData: profileDataProp }: Props) => {
  const { data: profileDataFromHook } = useGetFundraisingProfile();
  const profileData = profileDataProp || profileDataFromHook; // Use prop if provided, otherwise use hook
  const updateProfileMutation = useUpdateFundraisingProfile();
  const { data } = useTeamsFormOptions();
  const { data: demoDayData } = useGetDemoDayState();

  // Analytics hooks
  const { onFounderSaveTeamDetailsClicked, onFounderCancelTeamDetailsClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const currentUserInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isDirectoryAdmin = isAdminUser(currentUserInfo);

  const programOptions = useMemo(() => {
    if (!demoDayData?.programFieldEnabled || !demoDayData.programFieldOptions?.length) return [];
    return demoDayData.programFieldOptions.map((name: string) => ({ value: name, label: name }));
  }, [demoDayData?.programFieldEnabled, demoDayData?.programFieldOptions]);

  const options: IndustryFundingOpts = useMemo(() => {
    if (!data) {
      return {
        industryTagsOptions: [],
        fundingStageOptions: [],
      };
    }

    return {
      industryTagsOptions: data.industryTags.map((val: { id: any; name: any }) => ({
        value: val.id,
        label: val.name,
      })),
      fundingStageOptions: data.fundingStage
        .filter((val: { id: any; name: any }) => val.name !== 'Not Applicable')
        .map((val: { id: any; name: any }) => ({
          value: val.id,
          label: val.name,
        })),
    };
  }, [data]);

  const methods = useForm<EditProfileFormData>({
    defaultValues: getFormDataFromProfile(profileData, options, programOptions),
    resolver: yupResolver(schema),
  });

  // Reset form when profile data changes
  useEffect(() => {
    if (profileData) {
      const formData = getFormDataFromProfile(profileData, options, programOptions);

      methods.reset(formData);
    }
  }, [profileData, methods, options, programOptions]);

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: EditProfileFormData) => {
    try {
      let image = '';

      if (formData.image) {
        const imgResponse = await saveRegistrationImage(formData.image);
        image = imgResponse?.image.uid;
      }

      const updateData = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        industryTags: formData.tags.map((t) => t.value),
        fundingStage: formData.fundingStage?.value || profileData?.team?.fundingStage?.uid || undefined,
        logo: image || profileData?.team.logo?.uid,
        website: formData.website,
        program: formData.program?.value || undefined,
        teamUid: profileDataProp?.teamUid,
      };

      await updateProfileMutation.mutateAsync(updateData);

      // Report save analytics
      if (currentUserInfo?.email) {
        // PostHog analytics
        onFounderSaveTeamDetailsClicked();

        // Custom analytics event
        const saveEvent: TrackEventDto = {
          name: DEMO_DAY_ANALYTICS.ON_FOUNDER_SAVE_TEAM_DETAILS_CLICKED,
          distinctId: currentUserInfo.email,
          properties: {
            userId: currentUserInfo.uid,
            userEmail: currentUserInfo.email,
            userName: currentUserInfo.name,
            path: '/demoday',
            timestamp: new Date().toISOString(),
            teamName: formData.name,
            teamUid: profileData?.teamUid,
            hasLogoUpdate: !!formData.image,
            industryTagsCount: formData.tags.length,
            fundingStage: formData.fundingStage?.label,
            fieldsUpdated: [
              'name',
              'shortDescription',
              'industryTags',
              'fundingStage',
              ...(formData.image ? ['logo'] : []),
            ],
          },
        };

        reportAnalytics.mutate(saveEvent);
      }

      reset();
      onClose(true); // Pass true to indicate successful save
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Report cancel analytics
    if (currentUserInfo?.email) {
      // PostHog analytics
      onFounderCancelTeamDetailsClicked();

      // Custom analytics event
      const cancelEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_FOUNDER_CANCEL_TEAM_DETAILS_CLICKED,
        distinctId: currentUserInfo.email,
        properties: {
          userId: currentUserInfo.uid,
          userEmail: currentUserInfo.email,
          userName: currentUserInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          teamName: profileData?.team?.name,
          teamUid: profileData?.teamUid,
          action: 'cancel_form',
        },
      };

      reportAnalytics.mutate(cancelEvent);
    }

    reset();
    onClose(false); // Pass false to indicate cancel
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
        <EditFormControls onClose={handleCancel} title="Edit Profile Details" />
        <div className={s.body}>
          <div className={s.row}>
            <ProfileImageInput
              member={{
                profile: profileData?.team?.logo?.url || '',
                name: profileData?.team?.name || 'Team Name',
              }}
            />
            <FormField name="name" label="Team Name" placeholder="Enter team name" max={50} />
          </div>
          <div className={s.row}>
            <FormField
              name="shortDescription"
              label="Short Description"
              placeholder="Describe your team and what you do..."
              max={100}
            />
          </div>

          <div className={s.row}>
            <FormMultiSelect
              name="tags"
              label="Tags"
              placeholder="Add tags (e.g., AI, Blockchain, FinTech)"
              options={options.industryTagsOptions}
            />
          </div>

          <div className={s.row}>
            <FormSelect
              name="fundingStage"
              label="Company Stage"
              placeholder="Select your current company stage"
              options={options.fundingStageOptions}
            />
          </div>

          {demoDayData?.programFieldEnabled && programOptions.length > 0 && (
            <div className={s.row}>
              <FormSelect
                name="program"
                label="Program"
                placeholder="Select your program"
                options={programOptions}
              />
            </div>
          )}

          <div className={s.row}>
            <FormField name="website" label="Website" placeholder="Enter your website URL" />
          </div>
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
