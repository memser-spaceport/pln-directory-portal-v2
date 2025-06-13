import React from 'react';

import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { ProfileBioInput } from '@/components/page/member-details/ProfileDetails/components/ProfileBioInput';
import { ProfileLocationInput } from '@/components/page/member-details/ProfileDetails/components/ProfileLocationInput';
import { ProfileSkillsInput } from '@/components/page/member-details/ProfileDetails/components/ProfileSkillsInput';
import { TEditProfileForm } from '@/components/page/member-details/ProfileDetails/types';
import { ProfileCollaborateInput } from '@/components/page/member-details/ProfileDetails/components/ProfileCollaborateInput';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { omit } from 'lodash';
import { saveRegistrationImage } from '@/services/registration.service';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { useRouter } from 'next/navigation';

import s from './EditProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { editProfileSchema } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/helpers';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const methods = useForm<TEditProfileForm>({
    defaultValues: {
      image: null,
      name: member.name || '',
      bio: member.bio || '',
      country: member.location?.country || '',
      state: member.location?.region || '',
      city: member.location?.city || '',
      skills:
        member.skills.map((item) => ({
          id: item.uid,
          name: item.title,
        })) ?? [],
      openToCollaborate: member.openToWork,
    },
    resolver: yupResolver(editProfileSchema),
  });
  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMember();
  const { data: memberData } = useMember(userInfo.uid);

  const onSubmit = async (formData: TEditProfileForm) => {
    if (!memberData) {
      return;
    }

    let image;

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);

      image = imgResponse?.image.uid;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: {
        ...formatPayload(memberData.memberInfo, formData),
        imageUid: image ? image : memberData.memberInfo.imageUid,
      },
    };

    const res = await mutateAsync({
      uid: memberData.memberInfo.uid,
      payload,
    });

    if (!res.isError) {
      router.refresh();
      reset();
      onClose();
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
            <ProfileImageInput userInfo={userInfo} />
            <FormField name="name" label="Name*" placeholder="Text" />
          </div>
          <div className={s.row}>
            <ProfileBioInput />
          </div>
          <div className={s.row}>
            <ProfileLocationInput />
          </div>
          <div className={s.row}>
            <ProfileSkillsInput />
          </div>
          <div className={s.row}>
            <ProfileCollaborateInput />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

function formatPayload(memberInfo: any, formData: TEditProfileForm) {
  return {
    name: formData.name,
    email: memberInfo.email,
    plnStartDate: memberInfo.plnStartDate,
    city: formData.city,
    region: formData.state,
    country: formData.country,
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: memberInfo.linkedinHandler,
    discordHandler: memberInfo.discordHandler,
    twitterHandler: memberInfo.twitterHandler,
    githubHandler: memberInfo.githubHandler,
    telegramHandler: memberInfo.telegramHandler,
    officeHours: memberInfo.officeHours,
    moreDetails: memberInfo.moreDetails,
    openToWork: formData.openToCollaborate,
    plnFriend: memberInfo.plnFriend,
    teamAndRoles: memberInfo.teamMemberRoles,
    projectContributions: memberInfo.projectContributions?.map((contribution: any) => ({
      ...omit(contribution, 'projectName'),
    })),
    skills: formData.skills?.map((skill: any) => ({
      title: skill.name,
      uid: skill.id,
    })),
    bio: formData.bio,
  };
}
