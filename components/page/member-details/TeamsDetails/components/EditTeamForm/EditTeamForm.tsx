import React, { useMemo } from 'react';

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
import Image from 'next/image';
import { useGetTeam } from '@/services/teams/hooks/useGetTeam';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
  const { handleSubmit, reset, watch } = methods;
  const formValues = watch();
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

  const { data: selectedTeamData } = useGetTeam(formValues.name?.value);

  const previewData = useMemo(() => {
    if (!selectedTeamData) {
      return null;
    }

    return {
      logo: selectedTeamData?.logo,
      name: selectedTeamData?.name,
      role: formValues.role,
    };
  }, [formValues, selectedTeamData]);

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title={isNew ? 'Add Team' : 'Edit Team'} />
        <div className={s.body}>
          {previewData ? (
            <div className={s.expItem}>
              {previewData?.logo ? <Image src={previewData.logo ?? '/icons/default-project.svg'} alt={previewData.name ?? ''} width={40} height={40} className={s.logo} /> : <ExpIcon />}
              <div className={s.details}>
                <div className={s.row}>
                  <div className={s.primaryLabel}>{previewData.name}</div>
                </div>
                <div className={s.row}>
                  <div className={s.secondaryLabel}>{previewData.role}</div>
                </div>
              </div>
            </div>
          ) : (
            formValues?.name?.value && (
              <div className={s.expItem}>
                <Skeleton inline width={40} height={40} style={{ minWidth: 40, display: 'block', background: '#f3f3f3' }} borderRadius={8} />
                <div className={s.details}>
                  <div className={s.row}>
                    <Skeleton count={1} inline width={90} height={20} style={{ display: 'block', background: '#f3f3f3' }} borderRadius={4} />
                  </div>
                  <div className={s.row}>
                    <Skeleton count={1} inline width={60} height={14} style={{ minWidth: 90, background: '#f3f3f3', display: 'block' }} borderRadius={4} />
                  </div>
                </div>
              </div>
            )
          )}

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

const ExpIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M33.75 8.75H27.5V7.5C27.5 6.50544 27.1049 5.55161 26.4017 4.84835C25.6984 4.14509 24.7446 3.75 23.75 3.75H16.25C15.2554 3.75 14.3016 4.14509 13.5983 4.84835C12.8951 5.55161 12.5 6.50544 12.5 7.5V8.75H6.25C5.58696 8.75 4.95107 9.01339 4.48223 9.48223C4.01339 9.95107 3.75 10.587 3.75 11.25V31.25C3.75 31.913 4.01339 32.5489 4.48223 33.0178C4.95107 33.4866 5.58696 33.75 6.25 33.75H33.75C34.413 33.75 35.0489 33.4866 35.5178 33.0178C35.9866 32.5489 36.25 31.913 36.25 31.25V11.25C36.25 10.587 35.9866 9.95107 35.5178 9.48223C35.0489 9.01339 34.413 8.75 33.75 8.75ZM15 7.5C15 7.16848 15.1317 6.85054 15.3661 6.61612C15.6005 6.3817 15.9185 6.25 16.25 6.25H23.75C24.0815 6.25 24.3995 6.3817 24.6339 6.61612C24.8683 6.85054 25 7.16848 25 7.5V8.75H15V7.5ZM33.75 11.25V17.752C29.5309 20.0484 24.8036 21.251 20 21.25C15.1966 21.2509 10.4694 20.0486 6.25 17.753V11.25H33.75ZM33.75 31.25H6.25V20.569C10.5312 22.6631 15.2343 23.7515 20.0002 23.7511C24.7662 23.7508 29.4691 22.6617 33.75 20.567V31.25ZM16.25 17.5C16.25 17.1685 16.3817 16.8505 16.6161 16.6161C16.8505 16.3817 17.1685 16.25 17.5 16.25H22.5C22.8315 16.25 23.1495 16.3817 23.3839 16.6161C23.6183 16.8505 23.75 17.1685 23.75 17.5C23.75 17.8315 23.6183 18.1495 23.3839 18.3839C23.1495 18.6183 22.8315 18.75 22.5 18.75H17.5C17.1685 18.75 16.8505 18.6183 16.6161 18.3839C16.3817 18.1495 16.25 17.8315 16.25 17.5Z"
      fill="#CDD4DE"
    />
  </svg>
);
