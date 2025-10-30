import React, { useEffect, useMemo } from 'react';

import { ProfileImageInput } from '@/components/page/member-details/ProfileDetails/components/ProfileImageInput';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';

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
import { useUserStore } from '@/services/members/store';
import { updateMemberInfoCookie } from '@/utils/member.utils';

import s from './EditProfileForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { editProfileSchema } from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/helpers';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { toast } from '@/components/core/ToastContainer';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { MAX_NAME_LENGTH } from '@/constants/profile';
import { isInvestor } from '@/utils/isInvestor';
import { FormSelect } from '@/components/form/FormSelect';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const { actions } = useUserStore();

  // Find the main team from member.mainTeam or teamMemberRoles
  const mainTeamData = useMemo(() => {
    // First check if member.mainTeam exists
    if (member.mainTeam?.id) {
      return {
        team: {
          value: member.mainTeam.id,
          label: member.mainTeam.name || '',
        },
        role: member.mainTeam.role || '',
      };
    }
    return { team: undefined, role: '' };
  }, [member.mainTeam]);

  const methods = useForm<TEditProfileForm>({
    defaultValues: {
      image: null,
      name: member.name || '',

      country: member.location?.country || '',
      state: member.location?.region || '',
      city: member.location?.city || '',
      skills:
        member.skills.map((item) => ({
          value: item.uid,
          label: item.title,
        })) ?? [],
      openToCollaborate: member.openToWork,
      primaryTeam: mainTeamData.team,
      primaryTeamRole: mainTeamData.role,
    },
    resolver: yupResolver(editProfileSchema),
  });
  const { handleSubmit, reset, watch, setValue } = methods;
  const { mutateAsync } = useUpdateMember();
  const { data: memberData } = useMember(member.id);
  const { onSaveProfileDetailsClicked } = useMemberAnalytics();

  // Watch primaryTeam to show/hide role field
  const selectedPrimaryTeam = watch('primaryTeam');

  // Update role when primary team changes
  useEffect(() => {
    if (selectedPrimaryTeam?.value) {
      if (selectedPrimaryTeam.role) {
        setValue('primaryTeamRole', selectedPrimaryTeam.role || '');
      }
    } else {
      setValue('primaryTeamRole', '');
    }
  }, [selectedPrimaryTeam, member.teamMemberRoles, setValue]);

  const onSubmit = async (formData: TEditProfileForm) => {
    onSaveProfileDetailsClicked();

    if (!memberData) {
      return;
    }

    let image;
    let imageUrl = '';

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);
      image = imgResponse?.image.uid;
      imageUrl = imgResponse?.image.url;

      if (member.id === userInfo.uid) {
        actions.setProfileImage(imageUrl);
        updateMemberInfoCookie(imageUrl);
      }
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
    } else if (res?.errorData?.message) {
      toast.error(res.errorData.message);
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
            <ProfileImageInput member={member} />
            <FormField name="name" label="Name" isRequired placeholder="Text" max={MAX_NAME_LENGTH} />
          </div>

          <div className={s.row}>
            <ProfileLocationInput />
          </div>
          <div className={s.row}>
            <ProfileSkillsInput />
          </div>
          {!isInvestor(userInfo?.accessLevel) && (
            <div className={s.row}>
              <ProfileCollaborateInput />
            </div>
          )}

          {/* Primary Team Section */}
          <div className={s.row}>
            <FormSelect
              name="primaryTeam"
              placeholder="Select your primary team"
              backLabel="Teams"
              label="Primary Team"
              options={
                member.teams?.map((tmr) => ({
                  value: tmr.id,
                  label: tmr.name ?? '',
                  role: tmr.role,
                })) ?? []
              }
            />
          </div>

          {selectedPrimaryTeam && (
            <div className={s.row}>
              <FormField name="primaryTeamRole" label="Role in Primary Team" placeholder="Enter your role" />
            </div>
          )}

          {/* Info message */}
          <div className={s.infoBlock}>
            <InfoIcon />
            <span className={s.infoText}>Manage teams in the Teams section below</span>
          </div>
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14ZM8 7C8.27614 7 8.5 7.22386 8.5 7.5V10.5C8.5 10.7761 8.27614 11 8 11C7.72386 11 7.5 10.7761 7.5 10.5V7.5C7.5 7.22386 7.72386 7 8 7ZM8 5C7.72386 5 7.5 5.22386 7.5 5.5C7.5 5.77614 7.72386 6 8 6C8.27614 6 8.5 5.77614 8.5 5.5C8.5 5.22386 8.27614 5 8 5Z"
      fill="#64748B"
    />
  </svg>
);

function formatPayload(memberInfo: any, formData: TEditProfileForm) {
  // Update teamAndRoles to set mainTeam based on primaryTeam selection
  let updatedTeamAndRoles = memberInfo.teamMemberRoles;

  if (formData.primaryTeam) {
    // Update all teams: set mainTeam to true for selected primary team, false for others
    // Also update the role for the primary team
    updatedTeamAndRoles = memberInfo.teamMemberRoles?.map((tmr: any) => {
      if (tmr.teamUid === formData.primaryTeam?.value) {
        return {
          ...tmr,
          role: formData.primaryTeamRole || tmr.role,
          mainTeam: true,
        };
      }
      return {
        ...tmr,
        mainTeam: false,
      };
    });
  } else {
    // If no primary team selected, set all to false
    updatedTeamAndRoles = memberInfo.teamMemberRoles?.map((tmr: any) => ({
      ...tmr,
      mainTeam: false,
    }));
  }

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
    teamAndRoles: updatedTeamAndRoles,
    projectContributions: memberInfo.projectContributions?.map((contribution: any) => ({
      ...omit(contribution, 'projectName'),
    })),
    skills: formData.skills?.map((skill: any) => ({
      title: skill.label,
      uid: skill.value,
    })),
  };
}
