'use client';

import { useEffect, useRef } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { Checkbox } from '@/components/common/Checkbox';
import { FormField } from '@/components/form/FormField';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTextArea } from '@/components/form/FormTextArea';
import { BioInput } from '@/components/page/member-details/BioDetails/components/BioInput';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { toast } from '@/components/core/ToastContainer';
import { saveRegistrationImage } from '@/services/registration.service';
import { validatePariticipantsEmail } from '@/services/participants-request.service';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { ENROLLMENT_TYPE } from '@/utils/constants';
import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { editTeamDetailsSchema } from './helpers';

import s from './EditTeamDetailsForm.module.scss';
import Link from 'next/link';

type TOption = { label: string; value: string };

type TEditTeamDetailsForm = {
  image: File | null;
  isImageDeleted: boolean;
  name: string;
  shortDescription: string;
  isFund: boolean;
  fundingStage: TOption | null;
  industryTags: TOption[];
  about: string;
};

interface Props {
  team: ITeam;
  userInfo?: IUserInfo;
  onClose: () => void;
}

const toOption = (item?: { title?: string; uid?: string }, fallbackValue?: string): TOption | null => {
  if (!item?.title && !fallbackValue) return null;
  return { label: item?.title || fallbackValue || '', value: item?.uid || fallbackValue || item?.title || '' };
};

export const EditTeamDetailsForm = ({ team, onClose }: Props) => {
  const { data: formOptions } = useTeamsFormOptions();
  const analytics = useTeamAnalytics();

  const fundingStageOptions =
    formOptions?.fundingStage?.map((item: { id: string; name: string }) => ({ label: item.name, value: item.id })) ||
    [];
  const industryTagOptions =
    formOptions?.industryTags?.map((item: { id: string; name: string }) => ({ label: item.name, value: item.id })) ||
    [];

  const defaultFundingStage =
    fundingStageOptions.find((item: TOption) => item.label === team?.fundingStage?.title) ||
    toOption(team?.fundingStage);
  const defaultIndustryTags = team?.industryTags
    ?.map((item: any) => {
      return industryTagOptions.find((option: TOption) => option.label === item?.title) || toOption(item, item?.title);
    })
    .filter(Boolean) as TOption[];

  const methods = useForm<TEditTeamDetailsForm>({
    defaultValues: {
      image: null,
      isImageDeleted: false,
      name: team?.name || '',
      shortDescription: team?.shortDescription || '',
      isFund: team?.isFund ?? false,
      fundingStage: defaultFundingStage,
      industryTags: defaultIndustryTags,
      about: team?.longDescription || '',
    },
    // @ts-ignore
    resolver: yupResolver(editTeamDetailsSchema),
  });

  const { handleSubmit, reset, watch } = methods;
  const formValues = watch();
  const prevValuesRef = useRef<Record<string, unknown>>({});
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      prevValuesRef.current = JSON.parse(JSON.stringify(formValues));
      isFirstRenderRef.current = false;
      return;
    }
    for (const key of Object.keys(formValues)) {
      const prev = prevValuesRef.current[key];
      const curr = formValues[key as keyof TEditTeamDetailsForm];
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        const currVal = curr as unknown;
        const value =
          Array.isArray(currVal) && currVal[0] && typeof currVal[0] === 'object' && 'value' in currVal[0]
            ? (currVal as { value: string }[]).map((o) => o.value)
            : currVal && typeof currVal === 'object' && 'value' in currVal
              ? (currVal as { value: string }).value
              : currVal;
        analytics.onTeamDetailEditInputChanged({ field: key, value });
        break;
      }
    }
    prevValuesRef.current = JSON.parse(JSON.stringify(formValues));
  }, [formValues, analytics]);

  const commonOnSubmit = useOnSubmit(team, onClose);

  const onSubmit = async (formData: TEditTeamDetailsForm) => {
    if (formData.name.trim() !== (team?.name || '').trim()) {
      const nameVerification = await validatePariticipantsEmail(formData.name, ENROLLMENT_TYPE.TEAM);
      if (!nameVerification.isValid) {
        toast.error('Name Already exists!');
        return;
      }
    }

    let logoUid = team?.logoUid;

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);
      logoUid = imgResponse?.image?.uid;
    } else if (formData.isImageDeleted) {
      logoUid = undefined;
    }

    await commonOnSubmit({
      name: formData.name.trim(),
      shortDescription: formData.shortDescription.trim(),
      longDescription: formData.about,
      isFund: formData.isFund,
      fundingStage: formData.fundingStage
        ? { uid: formData.fundingStage.value, title: formData.fundingStage.label }
        : undefined,
      industryTags: formData.industryTags.map((item) => ({ uid: item.value, title: item.label })),
      contactMethod: team.contactMethod,
      website: team.website,
      twitterHandler: team.twitter,
      linkedinHandler: team.linkedinHandle,
      membershipSources: team.membershipSources,
      technologies: team.technologies,
      investorProfile: team.investorProfile,
      logoUid,
    });

    analytics.onTeamDetailEditFormSaved({
      from: 'teamProfile',
      values: {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        isFund: formData.isFund,
        fundingStage: formData.fundingStage?.value ?? null,
        industryTags: formData.industryTags.map((item) => item.value),
        about: formData.about,
      },
    });

    reset(formData);
  };

  return (
    <FormProvider {...methods}>
      {/* @ts-ignore */}
      <form className={s.form} onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Profile Details" onClose={onClose} />
        <div className={s.panel}>
          <div className={s.imageRow}>
            <ProfileImageInput member={{ name: team?.name || '', profile: team?.logo }} allowDelete />
            <FormField name="name" placeholder="Enter team name" label="Team Name" max={150} isRequired />
          </div>

          <FormTextArea
            name="shortDescription"
            placeholder="Add a short description"
            label="Short Description"
            maxLength={1000}
            // showCharCount
            rows={4}
            description={
              <>
                This description appears on your team&apos;s card in the{' '}
                <Link style={{ color: '#1b4dff' }} href="/teams" target="_blank">
                  Teams Page
                </Link>
                , not on this page. Keep it brief: 1–2 sentences work best.
              </>
            }
          />
          <div className={s.checkboxLabel}>
            <Checkbox
              checked={!!methods.watch('isFund')}
              onChange={(checked) => methods.setValue('isFund', !!checked, { shouldValidate: true, shouldDirty: true })}
            />
            <span className={s.checkboxText}>This team is an investment fund.</span>
          </div>
          <FormSelect
            name="fundingStage"
            label="Company Stage"
            placeholder="Select stage"
            options={fundingStageOptions}
          />
          <FormMultiSelect
            name="industryTags"
            label="Industry Tags"
            placeholder="Select industry tags"
            options={industryTagOptions}
            description="Add industries that you had worked in. This will make it easier for people to find & connect based on shared professional interests."
          />
          <BioInput
            name="about"
            label="About"
            simplified
            showGenerateWithAiButton={false}
            placeholder="Add long description"
          />
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
