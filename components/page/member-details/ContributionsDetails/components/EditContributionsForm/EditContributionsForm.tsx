import React from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember, IProjectContribution } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';

import { TEditContributionsForm } from '@/components/page/member-details/ContributionsDetails/types';
import { ContributionsDescriptionInput } from '@/components/page/member-details/ContributionsDetails/components/ContributionsDescriptionInput';
import { ContributionsDatesInput } from '@/components/page/member-details/ContributionsDetails/components/ContributionsDatesInput';

import s from './EditContributionsForm.module.scss';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
  initialData?: IProjectContribution | null;
}

export const EditContributionsForm = ({ onClose, member, userInfo, initialData }: Props) => {
  const isNew = !initialData;
  const methods = useForm<TEditContributionsForm>({
    defaultValues: {
      name: initialData?.project.name ?? '',
      role: initialData?.role ?? '',
      description: initialData?.description ?? '',
      startDate: initialData?.startDate || null,
      endDate: initialData?.endDate || null,
    },
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = (formData: TEditContributionsForm) => {
    console.log(formData);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title={isNew ? 'Add Project Contribution' : 'Edit Project Contribution'} />
        <div className={s.body}>
          <div className={s.row}>
            <FormField name="name" label="Project Name*" placeholder="Enter project name" />
          </div>
          <div className={s.row}>
            <FormField name="role" label="Role*" placeholder="Enter role" />
          </div>
          <div className={s.row}>
            <ContributionsDescriptionInput />
          </div>
          <div className={s.row}>
            <ContributionsDatesInput />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
