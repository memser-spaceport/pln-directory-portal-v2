import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { AddTeamModal } from '@/components/page/member-details/ProfileDetails/components/AddTeamModal';
import { useUpdateMemberSelfRole } from '@/services/members/hooks/useUpdateMemberSelfRole';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

export const EditProfileForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const { actions } = useUserStore();
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);

  // Find the main team from member.mainTeam or teamMemberRoles
  const mainTeamData = useMemo(() => {
    // First check if member.mainTeam exists
    if (member.mainTeam?.id) {
      return {
        team: {
          value: member.mainTeam.id,
          label: member.mainTeam.name || '',
          role: member.mainTeam.role || '',
        },
        role: member.mainTeam.role || '',
      };
    }
    return { team: null, role: '' };
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
      primaryTeamRole: mainTeamData.team ? mainTeamData.role : member.role,
    },
    resolver: yupResolver(editProfileSchema),
  });
  const { handleSubmit, reset, watch, setValue } = methods;
  const { mutateAsync } = useUpdateMember();
  const { mutateAsync: updateSelfRole } = useUpdateMemberSelfRole();
  const { data: memberData } = useMember(member.id);
  const { onSaveProfileDetailsClicked, onPrimaryTeamChanged } = useMemberAnalytics();

  // Watch primaryTeam to show/hide role field
  const selectedPrimaryTeam = watch('primaryTeam');

  // Store initial primary team to track changes
  const initialPrimaryTeamRef = useRef(mainTeamData.team);
  const initialPrimaryTeamRoleRef = useRef(mainTeamData.team ? mainTeamData.role : member.role);

  // Update role when primary team changes
  useEffect(() => {
    if (selectedPrimaryTeam?.value) {
      if (selectedPrimaryTeam.role) {
        setValue('primaryTeamRole', selectedPrimaryTeam.role || '');
      }
    }
  }, [selectedPrimaryTeam, member.teamMemberRoles, setValue]);

  const onSubmit = async (formData: TEditProfileForm) => {
    onSaveProfileDetailsClicked();

    // Track primary team change if it has changed
    const hasTeamChanged =
      initialPrimaryTeamRef.current?.value !== formData.primaryTeam?.value ||
      initialPrimaryTeamRoleRef.current !== formData.primaryTeamRole;

    if (
      !formData.primaryTeam &&
      formData.primaryTeamRole &&
      initialPrimaryTeamRoleRef.current !== formData.primaryTeamRole
    ) {
      await updateSelfRole({
        memberUid: member.id,
        role: formData.primaryTeamRole,
      });
    }

    if (hasTeamChanged) {
      onPrimaryTeamChanged({
        previousTeam: initialPrimaryTeamRef.current,
        newTeam: formData.primaryTeam,
        previousRole: initialPrimaryTeamRoleRef.current,
        newRole: formData.primaryTeamRole,
      });
    }

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
        role: formData.primaryTeamRole,
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

  const { data } = useMemberFormOptions();

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

          <div className={s.column}>
            <div className={s.inputsLabel}>Primary Role & Team</div>
            <div className={s.inputsWrapper}>
              <FormField name="primaryTeamRole" placeholder="Enter your primary role" />
              <span>@</span>
              <FormSelect
                name="primaryTeam"
                placeholder="Select your primary team"
                backLabel="Teams"
                options={
                  data?.teams.map((item: { teamUid: string; teamTitle: string }) => ({
                    value: item.teamUid,
                    label: item.teamTitle,
                    originalObject: item,
                  })) ?? []
                }
                renderOption={({ option, label, description }) => {
                  return (
                    <div className={s.teamOption}>
                      <ImageWithFallback
                        width={24}
                        height={24}
                        alt={option.label}
                        className={s.optImg}
                        fallbackSrc="/icons/camera.svg"
                        src={option.originalObject.logo}
                      />
                      <div>
                        {label}
                        {description}
                      </div>
                    </div>
                  );
                }}
                isStickyNoData
                notFoundContent={
                  <div className={s.secondaryLabel}>
                    Not able to find your project or team?
                    <button
                      type="button"
                      className={s.link}
                      onClick={() => {
                        setIsAddTeamModalOpen(true);
                      }}
                    >
                      Add your team
                    </button>
                  </div>
                }
              />
            </div>
            <div className={s.description}>Add your title and organization so others can connect with you.</div>
          </div>
          <div className={s.infoBlock}>
            <InfoIcon />
            <span className={s.infoText}>Manage teams in the Teams section below</span>
          </div>
        </div>
        <EditFormMobileControls />
      </form>

      {/* Add Team Modal */}
      <AddTeamModal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        requesterEmailId={userInfo.email!}
        onSuccess={() => {
          // Refresh the page to show the new team
          router.refresh();
        }}
      />
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
    const isUpdate = memberInfo.teamMemberRoles.some((tmr: any) => tmr.teamUid === formData.primaryTeam?.value);

    if (isUpdate) {
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
      updatedTeamAndRoles.push({
        teamUid: formData.primaryTeam?.value,
        teamTitle: formData.primaryTeam?.label,
        role: formData.primaryTeamRole || '',
        mainTeam: true,
      });
    }
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
