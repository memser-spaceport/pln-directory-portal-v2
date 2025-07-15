import React, { useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';

import { TEditContributionsForm } from '@/components/page/member-details/ContributionsDetails/types';
import { ContributionsDescriptionInput } from '@/components/page/member-details/ContributionsDetails/components/ContributionsDescriptionInput';
import { ContributionsDatesInput } from '@/components/page/member-details/ContributionsDetails/components/ContributionsDatesInput';

import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';
import { FormSelect } from '@/components/form/FormSelect';

import s from './EditContributionsForm.module.scss';
import { omit } from 'lodash';
import { useMember } from '@/services/members/hooks/useMember';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '../../../../../core/ConfirmDialog/ConfirmDialog';
import { yupResolver } from '@hookform/resolvers/yup';
import { editContributionsSchema } from '@/components/page/member-details/ContributionsDetails/components/EditContributionsForm/helpers';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

interface Props {
  onClose: () => void;
  member: IMember;
  initialData?: IProjectContribution | null;
}

export const EditContributionsForm = ({ onClose, member, initialData }: Props) => {
  const router = useRouter();
  const isNew = !initialData;
  const methods = useForm<TEditContributionsForm>({
    defaultValues: {
      name: initialData?.project
        ? {
            label: initialData.project.name,
            value: initialData.project.uid,
          }
        : undefined,
      role: initialData?.role ?? '',
      description: initialData?.description ?? '',
      startDate: initialData?.startDate || null,
      endDate: initialData?.endDate || null,
    },
    resolver: yupResolver(editContributionsSchema),
  });
  const { handleSubmit, reset } = methods;
  const { data: memberData } = useMember(member.id);
  const { data } = useMemberFormOptions();
  const { mutateAsync, isPending } = useUpdateMember();
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const { onDeleteContributionDetailsClicked, onSaveContributionDetailsClicked } = useMemberAnalytics();

  const onSubmit = async (formData: TEditContributionsForm) => {
    onSaveContributionDetailsClicked();
    if (!memberData) {
      return;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, formData, isNew, initialData?.uid),
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
    onDeleteContributionDetailsClicked();
    if (!memberData) {
      return;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: member.id,
      uniqueIdentifier: member.email,
      newData: formatPayload(memberData.memberInfo, {} as TEditContributionsForm, isNew, initialData?.uid, true),
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
        <EditFormControls onClose={onClose} title={isNew ? 'Add Project Contribution' : 'Edit Project Contribution'} />
        <div className={s.body}>
          <div className={s.row}>
            <FormSelect
              name="name"
              placeholder="Project"
              label="Project Name"
              isRequired
              options={
                data?.projects.map((item: { projectUid: string; projectName: string }) => ({
                  value: item.projectUid,
                  label: item.projectName,
                })) ?? []
              }
            />
          </div>
          <div className={s.row}>
            <FormField name="role" label="Role" isRequired placeholder="Enter role" />
          </div>
          <div className={s.row}>
            <ContributionsDatesInput />
          </div>
          <div className={s.row}>
            <ContributionsDescriptionInput />
          </div>
          {!isNew && (
            <>
              <button className={s.deleteBtn} type="button" onClick={() => setIsOpenDelete(true)}>
                <DeleteIcon /> Delete Contribution
              </button>
              <ConfirmDialog
                title="Delete Contribution"
                desc="Are you sure you want to delete selected contribution?"
                isOpen={isOpenDelete}
                onClose={() => setIsOpenDelete(false)}
                onConfirm={onDelete}
                disabled={isPending}
                confirmTitle={isPending ? 'Processing...' : 'Delete'}
              />
            </>
          )}
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};

function formatPayload(memberInfo: any, formData: TEditContributionsForm, isNew?: boolean, uid?: string, isDelete?: boolean) {
  let projectContributions;

  if (isNew) {
    projectContributions = [
      ...memberInfo.projectContributions?.map((contribution: any) => ({
        ...omit(contribution, 'projectName', 'uid'),
      })),
      {
        currentProject: false,
        description: formData.description,
        endDate: formData.endDate,
        projectUid: formData.name?.value,
        role: formData.role,
        startDate: formData.startDate,
      },
    ];
  } else if (isDelete) {
    projectContributions = memberInfo.projectContributions
      ?.filter((contribution: any) => contribution.uid !== uid)
      .map((contribution: any) => ({
        ...omit(contribution, 'projectName'),
      }));
  } else {
    projectContributions = memberInfo.projectContributions?.map((contribution: any) => {
      if (contribution.uid === uid) {
        return {
          ...omit(contribution, 'projectName', 'uid'),
          currentProject: false,
          description: formData.description,
          endDate: formData.endDate,
          projectUid: formData.name?.value,
          role: formData.role,
          startDate: formData.startDate,
        };
      }

      return {
        ...omit(contribution, 'projectName', 'uid'),
      };
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
    teamAndRoles: memberInfo.teamMemberRoles,
    projectContributions,
    skills: memberInfo.skills?.map((skill: any) => ({
      title: skill.name,
      uid: skill.id,
    })),
    bio: memberInfo.bio,
  };
}

const DeleteIcon = () => (
  <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.06641 1.24219C4.20312 0.941406 4.50391 0.75 4.83203 0.75H8.14062C8.46875 0.75 8.76953 0.941406 8.90625 1.24219L9.125 1.625H11.75C12.2148 1.625 12.625 2.03516 12.625 2.5C12.625 2.99219 12.2148 3.375 11.75 3.375H1.25C0.757812 3.375 0.375 2.99219 0.375 2.5C0.375 2.03516 0.757812 1.625 1.25 1.625H3.875L4.06641 1.24219ZM11.75 4.25L11.1484 13.5195C11.1211 14.2305 10.5469 14.75 9.83594 14.75H3.13672C2.42578 14.75 1.85156 14.2305 1.82422 13.5195L1.25 4.25H11.75Z"
      fill="#F71515"
    />
  </svg>
);
