import React from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { useRouter } from 'next/navigation';

import s from './EditTeamForm.module.scss';
import ConfirmDialog from '../../../../../core/ConfirmDialog/ConfirmDialog';
import { yupResolver } from '@hookform/resolvers/yup';
import { ITeam } from '@/types/teams.types';
import { editTeamSchema } from '@/components/page/member-details/TeamsDetails/components/EditTeamForm/helpers';
import { TEditTeamForm } from '@/components/page/member-details/TeamsDetails/types';
import { FormSelect } from '@/components/form/FormSelect';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { omit } from 'lodash';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

interface Props {
  onClose: () => void;
  member: IMember;
  initialData?: ITeam | null;
}

export const EditTeamForm = ({ onClose, member, initialData }: Props) => {
  const isNew = !initialData;
  const router = useRouter();
  const methods = useForm<TEditTeamForm>({
    defaultValues: {
      url: initialData?.website ?? '',
      name: initialData?.name
        ? {
            label: initialData.name,
            value: initialData.id,
          }
        : undefined,
      role: initialData?.role ?? '',
    },
    resolver: yupResolver(editTeamSchema),
  });
  const { handleSubmit, reset } = methods;
  const { data } = useMemberFormOptions();
  const [isOpenDelete, setIsOpenDelete] = React.useState(false);
  const { data: memberData } = useMember(member.id);
  const { mutateAsync, isPending } = useUpdateMember();

  const onSubmit = async (formData: TEditTeamForm) => {
    if (!memberData) {
      return;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, formData, isNew, initialData?.id),
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

  const onDelete = async () => {
    if (!initialData) {
      return;
    }

    if (!memberData) {
      return;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, {} as TEditTeamForm, isNew, initialData?.id, true),
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
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title={isNew ? 'Add Team' : 'Edit Team'} />
        <div className={s.body}>
          <div className={s.row}>
            <FormField name="url" label="Team URL" placeholder="Enter team url" />
          </div>
          <div className={s.row}>
            <FormSelect
              name="name"
              placeholder="Enter your team"
              label="Team"
              isRequired
              options={
                data?.teams.map((item: { teamUid: string; teamTitle: string }) => ({
                  value: item.teamUid,
                  label: item.teamTitle,
                })) ?? []
              }
            />
          </div>
          <div className={s.row}>
            <FormField name="role" label="Role" placeholder="Enter your title/role" />
          </div>
          {!isNew && (
            <>
              <button className={s.deleteBtn} type="button" onClick={() => setIsOpenDelete(true)}>
                <DeleteIcon /> Delete Team
              </button>
              <ConfirmDialog
                title="Delete Team"
                desc="Are you sure you want to delete selected team?"
                isOpen={isOpenDelete}
                onClose={() => setIsOpenDelete(false)}
                onConfirm={onDelete}
                confirmTitle="Delete"
              />
            </>
          )}
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};

const DeleteIcon = () => (
  <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.06641 1.24219C4.20312 0.941406 4.50391 0.75 4.83203 0.75H8.14062C8.46875 0.75 8.76953 0.941406 8.90625 1.24219L9.125 1.625H11.75C12.2148 1.625 12.625 2.03516 12.625 2.5C12.625 2.99219 12.2148 3.375 11.75 3.375H1.25C0.757812 3.375 0.375 2.99219 0.375 2.5C0.375 2.03516 0.757812 1.625 1.25 1.625H3.875L4.06641 1.24219ZM11.75 4.25L11.1484 13.5195C11.1211 14.2305 10.5469 14.75 9.83594 14.75H3.13672C2.42578 14.75 1.85156 14.2305 1.82422 13.5195L1.25 4.25H11.75Z"
      fill="#F71515"
    />
  </svg>
);

function formatPayload(memberInfo: any, formData: TEditTeamForm, isNew?: boolean, uid?: string, isDelete?: boolean) {
  let teams;

  if (isNew) {
    teams = [
      ...memberInfo.teamMemberRoles,
      {
        role: formData.role,
        teamTitle: formData.name.label,
        teamUid: formData.name.value,
      },
    ];
  } else if (isDelete) {
    teams = memberInfo.teamMemberRoles?.filter((item: any) => item.teamUid !== uid);
  } else {
    teams = memberInfo.teamMemberRoles?.map((item: any) => {
      if (item.teamUid === uid) {
        return {
          ...item,
          role: formData.role,
          teamTitle: formData.name.label,
          teamUid: formData.name.value,
        };
      }

      return item;
    });
  }

  return {
    imageUid: memberInfo.imageUid,
    name: memberInfo.name,
    email: memberInfo.email,
    plnStartDate: memberInfo.plnStartDate,
    city: '',
    region: '',
    country: '',
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: memberInfo.linkedinHandler,
    discordHandler: memberInfo.discordHandler,
    twitterHandler: memberInfo.twitterHandler,
    githubHandler: memberInfo.githubHandler,
    telegramHandler: memberInfo.telegramHandler,
    officeHours: memberInfo.officeHours,
    moreDetails: memberInfo.moreDetails,
    openToWork: memberInfo.openToWork,
    plnFriend: memberInfo.plnFriend,
    teamAndRoles: teams,
    projectContributions: memberInfo.projectContributions?.map((contribution: any) => ({
      ...omit(contribution, 'projectName'),
    })),
    skills: memberInfo.skills?.map((skill: any) => ({
      title: skill.name,
      uid: skill.id,
    })),
    bio: memberInfo.bio,
  };
}
