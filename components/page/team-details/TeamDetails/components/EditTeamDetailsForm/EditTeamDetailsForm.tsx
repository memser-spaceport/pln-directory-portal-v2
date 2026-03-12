'use client';

import Cookies from 'js-cookie';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';

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
import { updateTeam } from '@/services/teams.service';
import { useTeamsFormOptions } from '@/services/teams/hooks/useTeamsFormOptions';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { ENROLLMENT_TYPE } from '@/utils/constants';

import { editTeamDetailsSchema } from './helpers';

import s from './EditTeamDetailsForm.module.scss';

type TOption = { label: string; value: string };

type TEditTeamDetailsForm = {
  image: File | null;
  isImageDeleted: boolean;
  name: string;
  shortDescription: string;
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
  const router = useRouter();
  const { data: formOptions } = useTeamsFormOptions();

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
      fundingStage: defaultFundingStage,
      industryTags: defaultIndustryTags,
      about: team?.longDescription || '',
    },
    // @ts-ignore
    resolver: yupResolver(editTeamDetailsSchema),
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = async (formData: TEditTeamDetailsForm) => {
    const authToken = Cookies.get('authToken');
    if (!authToken) return;

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

    const payload = {
      participantType: 'TEAM',
      referenceUid: team.id,
      uniqueIdentifier: team.name,
      newData: {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.about,
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
        isFund: team.isFund,
        logoUid,
      },
    };

    const { isError } = await updateTeam(payload, JSON.parse(authToken), team.id);

    if (isError) {
      toast.error('Team updated failed. Something went wrong, please try again later');
      return;
    }

    toast.success('Team updated successfully');
    reset(formData);
    onClose();
    router.refresh();
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
            showCharCount
            rows={4}
          />
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
