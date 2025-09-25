import React, { useEffect, useTransition } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { FormattedMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { TEditExperienceForm } from '@/components/page/member-details/ExperienceDetails/types';
import { ExperienceDescriptionInput } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDescriptionInput';

import { ExperienceDatesInput } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDatesInput';
import { useFormState } from 'react-dom';
import { MemberExperienceFormAction } from '@/app/actions/members.experience.actions';
import { useRouter } from 'next/navigation';

import s from './EditExperienceForm.module.scss';
import ConfirmDialog from '../../../../../core/ConfirmDialog/ConfirmDialog';
import { yupResolver } from '@hookform/resolvers/yup';
import { editExperienceSchema } from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm/helpers';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

interface Props {
  onClose: () => void;
  member: IMember;
  initialData?: FormattedMemberExperience | null;
}

export const EditExperienceForm = ({ onClose, member, initialData }: Props) => {
  const isNew = !initialData;
  const router = useRouter();
  const methods = useForm<TEditExperienceForm>({
    defaultValues: {
      title: initialData?.title ?? '',
      company: initialData?.company ?? '',
      description: initialData?.description ?? '',
      startDate: initialData?.startDate || new Date().toISOString(),
      endDate: initialData?.endDate || null,
      isCurrent: initialData?.isCurrent ?? false,
      location: initialData?.location ?? '',
    },
    resolver: yupResolver(editExperienceSchema),
  });
  const { handleSubmit, reset } = methods;

  const [isOpenDelete, setIsOpenDelete] = React.useState(false);
  const initialState = { success: false, message: '', errorCode: '', errors: {} };
  const [state, formAction] = useFormState(MemberExperienceFormAction, initialState);
  const [isPending, startTransition] = useTransition();
  const { onSaveExperienceDetailsClicked, onDeleteExperienceDetailsClicked } = useMemberAnalytics();

  const onSubmit = (formData: TEditExperienceForm) => {
    if (isPending) {
      return;
    }

    onSaveExperienceDetailsClicked();
    const _formData = new FormData();
    _formData.append('actionType', 'save');
    _formData.append('experience-title', formData.title);
    _formData.append('experience-company', formData.company);
    _formData.append('add-edit-experience-startDate', formData.startDate ?? '');
    _formData.append('add-edit-experience-endDate', formData.endDate ?? '');
    _formData.append('experience-location', formData.location ?? '');
    _formData.append('isCurrent', formData.isCurrent ? 'true' : 'false');
    _formData.append('memberId', member.id);
    _formData.append('description', formData.description);

    if (!isNew) {
      _formData.append('experience-uid', initialData?.uid);
    }

    startTransition(() => {
      formAction(_formData);
    });
  };

  const onDelete = () => {
    if (isPending) {
      return;
    }

    onDeleteExperienceDetailsClicked();
    if (!initialData) {
      return;
    }

    const _formData = new FormData();
    _formData.append('actionType', 'delete');
    _formData.append('experience-uid', initialData.uid);

    startTransition(() => {
      formAction(_formData);
    });
  };

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      reset();
      onClose();
    }
  }, [onClose, reset, router, state?.success]);

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls onClose={onClose} title={isNew ? 'Add Experience' : 'Edit Experience'} />
        <div className={s.body}>
          <div className={s.row}>
            <FormField name="title" label="Role" isRequired placeholder="Enter role" />
          </div>
          <div className={s.row}>
            <FormField
              name="company"
              label="Team or Organization"
              isRequired
              placeholder="Enter team or organization"
            />
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

          {!isNew && (
            <>
              <button className={s.deleteBtn} type="button" onClick={() => setIsOpenDelete(true)}>
                <DeleteIcon /> Delete Experience
              </button>
              <ConfirmDialog
                title="Delete Experience"
                desc="Are you sure you want to delete selected experience?"
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
