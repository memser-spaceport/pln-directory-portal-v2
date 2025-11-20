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
  const [newlyAddedTeamName, setNewlyAddedTeamName] = useState<string | null>(null);

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

    if (member.teams.length === 1) {
      return {
        team: {
          value: member.teams[0].id,
          label: member.teams[0].name || '',
          role: member.role || '',
        },
        role: member.role || '',
      };
    }

    return { team: null, role: '' };
  }, [member.mainTeam?.id, member.mainTeam?.name, member.mainTeam?.role, member.role, member.teams]);

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
  const {
    onSaveProfileDetailsClicked,
    onPrimaryTeamChanged,
    onAddTeamDropdownClicked,
    onPrimaryRoleSelected,
    onPrimaryTeamSelected,
  } = useMemberAnalytics();

  // Watch primaryTeam to show/hide role field
  const selectedPrimaryTeam = watch('primaryTeam');
  const selectedPrimaryTeamRole = watch('primaryTeamRole');

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

  // Auto-select newly added team when it becomes available in the options
  useEffect(() => {
    if (newlyAddedTeamName && data?.teams) {
      const newTeam = data.teams.find(
        (team: { teamUid: string; teamTitle: string }) =>
          team.teamTitle.toLowerCase() === newlyAddedTeamName.toLowerCase(),
      );

      if (newTeam) {
        setValue(
          'primaryTeam',
          {
            value: newTeam.teamUid,
            label: newTeam.teamTitle,
            // @ts-ignore
            originalObject: newTeam,
          },
          { shouldValidate: true, shouldDirty: true },
        );
        setNewlyAddedTeamName(null); // Clear the flag
      }
    }
  }, [data?.teams, newlyAddedTeamName, setValue]);

  // Track primary role selection
  useEffect(() => {
    if (selectedPrimaryTeamRole && selectedPrimaryTeamRole !== initialPrimaryTeamRoleRef.current) {
      onPrimaryRoleSelected(selectedPrimaryTeamRole);
    }
  }, [selectedPrimaryTeamRole, onPrimaryRoleSelected]);

  // Track primary team selection
  useEffect(() => {
    if (selectedPrimaryTeam && selectedPrimaryTeam.value !== initialPrimaryTeamRef.current?.value) {
      onPrimaryTeamSelected(selectedPrimaryTeam.label, selectedPrimaryTeam.value);
    }
  }, [selectedPrimaryTeam, onPrimaryTeamSelected]);

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
                placeholder="Search or add a team"
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
                      <div className={s.optionContent}>
                        {label}
                        {description}
                      </div>
                    </div>
                  );
                }}
                isStickyNoData
                notFoundContent={
                  <div className={s.secondaryLabel}>
                    Not able to find your project or team?{' '}
                    <button
                      type="button"
                      className={s.link}
                      onClick={() => {
                        onAddTeamDropdownClicked('profile-edit');
                        setIsAddTeamModalOpen(true);
                      }}
                    >
                      Add your team
                    </button>
                  </div>
                }
              />
            </div>
            <div className={s.description}>Add your role and team so others can connect with you.</div>
          </div>
          <div className={s.infoBlock}>
            <InfoIcon />
            <span className={s.infoText}>Manage additional teams/roles in Teams section below.</span>
          </div>
        </div>
        <EditFormMobileControls />
      </form>

      {/* Add Team Modal */}
      <AddTeamModal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        requesterEmailId={userInfo.email!}
        onSuccess={(teamName: string) => {
          // Store the newly added team name to auto-select it when data refreshes
          setNewlyAddedTeamName(teamName);
          // Refresh the page to show the new team
          router.refresh();
        }}
      />
    </FormProvider>
  );
};

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM12 20.25C10.3683 20.25 8.77326 19.7661 7.41655 18.8596C6.05984 17.9531 5.00242 16.6646 4.378 15.1571C3.75358 13.6496 3.5902 11.9908 3.90853 10.3905C4.22685 8.79016 5.01259 7.32015 6.16637 6.16637C7.32016 5.01259 8.79017 4.22685 10.3905 3.90852C11.9909 3.59019 13.6497 3.75357 15.1571 4.37799C16.6646 5.00242 17.9531 6.05984 18.8596 7.41655C19.7661 8.77325 20.25 10.3683 20.25 12C20.2475 14.1873 19.3775 16.2843 17.8309 17.8309C16.2843 19.3775 14.1873 20.2475 12 20.25ZM13.5 16.5C13.5 16.6989 13.421 16.8897 13.2803 17.0303C13.1397 17.171 12.9489 17.25 12.75 17.25C12.3522 17.25 11.9706 17.092 11.6893 16.8107C11.408 16.5294 11.25 16.1478 11.25 15.75V12C11.0511 12 10.8603 11.921 10.7197 11.7803C10.579 11.6397 10.5 11.4489 10.5 11.25C10.5 11.0511 10.579 10.8603 10.7197 10.7197C10.8603 10.579 11.0511 10.5 11.25 10.5C11.6478 10.5 12.0294 10.658 12.3107 10.9393C12.592 11.2206 12.75 11.6022 12.75 12V15.75C12.9489 15.75 13.1397 15.829 13.2803 15.9697C13.421 16.1103 13.5 16.3011 13.5 16.5ZM10.5 7.875C10.5 7.6525 10.566 7.43499 10.6896 7.24998C10.8132 7.06498 10.9889 6.92078 11.1945 6.83564C11.4001 6.75049 11.6263 6.72821 11.8445 6.77162C12.0627 6.81502 12.2632 6.92217 12.4205 7.0795C12.5778 7.23684 12.685 7.43729 12.7284 7.65552C12.7718 7.87375 12.7495 8.09995 12.6644 8.30552C12.5792 8.51109 12.435 8.68679 12.25 8.8104C12.065 8.93402 11.8475 9 11.625 9C11.3266 9 11.0405 8.88147 10.8295 8.6705C10.6185 8.45952 10.5 8.17337 10.5 7.875Z"
      fill="#455468"
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
