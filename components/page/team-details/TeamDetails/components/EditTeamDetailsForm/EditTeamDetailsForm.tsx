'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { Checkbox } from '@/components/common/Checkbox';
import { FormField } from '@/components/form/FormField';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { FormSelect } from '@/components/form/FormSelect';
import { FormSwitch } from '@/components/form/FormSwitch';
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
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { isTeamInactive } from '../../utils/isTeamInactive';

import { editTeamDetailsSchema } from './helpers';

import s from './EditTeamDetailsForm.module.scss';

type TOption = { label: string; value: string };

type TEditTeamDetailsForm = {
  image: File | null;
  isImageDeleted: boolean;
  name: string;
  shortDescription: string;
  dateFounded: string;
  teamSize: string;
  location: string;
  isActive: boolean;
  isFund: boolean;
  fundingStage: TOption | null;
  industryTags: TOption[];
  about: string;
};

interface Props {
  team: ITeam;
  userInfo?: IUserInfo | null;
  onClose: () => void;
}

const toOption = (item?: { title?: string; uid?: string }, fallbackValue?: string): TOption | null => {
  if (!item?.title && !fallbackValue) return null;
  return { label: item?.title || fallbackValue || '', value: item?.uid || fallbackValue || item?.title || '' };
};

export const EditTeamDetailsForm = ({ team, userInfo, onClose }: Props) => {
  const { data: formOptions } = useTeamsFormOptions();
  const analytics = useTeamAnalytics();
  const isAdmin = isAdminUser(userInfo);

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
      dateFounded: team?.dateFounded ? String(team.dateFounded) : '',
      teamSize: team?.teamSize === null || team?.teamSize === undefined ? '' : String(team.teamSize),
      location: team?.location || '',
      isActive: !isTeamInactive(team),
      isFund: team?.isFund ?? false,
      fundingStage: defaultFundingStage,
      industryTags: defaultIndustryTags,
      about: team?.longDescription || '',
    },
    // @ts-ignore
    resolver: yupResolver(editTeamDetailsSchema),
  });

  const { handleSubmit, reset, watch, setValue } = methods;
  const formValues = watch();
  const prevValuesRef = useRef<Record<string, unknown>>({});
  const isFirstRenderRef = useRef(true);

  const dateFoundedValue = formValues.dateFounded;
  useEffect(() => {
    const digitsOnly = (dateFoundedValue ?? '').replace(/\D/g, '').slice(0, 4);

    if (digitsOnly !== dateFoundedValue) {
      setValue('dateFounded', digitsOnly, { shouldValidate: true, shouldDirty: true });
    }
  }, [dateFoundedValue, setValue]);

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

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, onClose);

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
      dateFounded: formData.dateFounded.trim() ? Number(formData.dateFounded.trim()) : null,
      teamSize: formData.teamSize.trim() || null,
      location: formData.location.trim() || null,
      ...(isAdmin ? { status: formData.isActive ? 'ACTIVE' : 'INACTIVE' } : {}),
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
        dateFounded: formData.dateFounded.trim(),
        teamSize: formData.teamSize.trim(),
        location: formData.location.trim(),
        isActive: formData.isActive,
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
        <EditFormControls title="Edit Profile Details" onClose={onClose} isProcessing={isPending} />
        <div className={s.panel}>
          <div className={s.imageRow}>
            <ProfileImageInput member={{ name: team?.name || '', profile: team?.logo }} allowDelete />
            <FormField name="name" placeholder="Enter team name" label="Team Name" max={150} isRequired />
          </div>

          <FormField
            name="shortDescription"
            placeholder="Add a short description"
            label="Short Description"
            max={100}
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
          <FormField
            name="dateFounded"
            placeholder="eg., 2014"
            label="Date Founded"
            maxLength={4}
            inputMode="numeric"
            description="The 4-digit year your team was founded."
          />

          <FormField
            name="teamSize"
            placeholder="eg., 50 or 11-50"
            label="Team Size"
            description="Employee count as a number, or a range label."
          />

          <FormField
            name="location"
            placeholder="eg., San Francisco, United States"
            label="Location"
            description="Where your team is based."
          />

          {isAdmin && (
            <FormSwitch
              name="isActive"
              label="This team is active"
              helperText="Inactive teams are hidden from the Teams page and search, and their profile shows an “Inactive” badge."
            />
          )}

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
