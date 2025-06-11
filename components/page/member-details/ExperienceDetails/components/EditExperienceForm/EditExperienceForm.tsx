import React from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { TEditExperienceForm } from '@/components/page/member-details/ExperienceDetails/types';
import { ExperienceDescriptionInput } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDescriptionInput';

import s from './EditExperienceForm.module.scss';
import { ExperienceDatesInput } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDatesInput';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
  initialData?: FormattedMemberExperience | null;
}

export const EditExperienceForm = ({ onClose, member, userInfo, initialData }: Props) => {
  const isNew = !initialData;
  const methods = useForm<TEditExperienceForm>({
    defaultValues: {
      title: initialData?.title ?? '',
      company: initialData?.company ?? '',
      description: initialData?.description ?? '',
      startDate: initialData?.startDate || null,
      endDate: initialData?.endDate || null,
      isCurrent: initialData?.isCurrent ?? false,
      location: initialData?.location ?? '',
    },
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = (formData: TEditExperienceForm) => {
    console.log(formData);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title={isNew ? 'Add Experience' : 'Edit Experience'} />
        <div className={s.body}>
          <div className={s.row}>
            <FormField name="title" label="Role*" placeholder="Enter role" />
          </div>
          <div className={s.row}>
            <FormField name="company" label="Team or Organization*" placeholder="Enter team or organization" />
          </div>
          <div className={s.row}>
            <ExperienceDescriptionInput />
          </div>
          <div className={s.row}>
            <ExperienceDatesInput />
          </div>
          <div className={s.row}>
            <FormField name="location" label="Location" placeholder="Enter location" />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
