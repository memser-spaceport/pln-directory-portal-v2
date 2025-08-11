import React from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { FormField } from '@/components/form/FormField';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { TEditOfficeHoursForm } from '@/components/page/member-details/OfficeHoursDetails/types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { useMember } from '@/services/members/hooks/useMember';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ADMIN_ROLE } from '@/utils/constants';
import * as yup from 'yup';

import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';
import { FormTagsInput } from '@/components/form/FormTagsInput';

import s from './EditOfficeHoursForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
}

const schema = yup.object().shape({
  officeHours: yup.string().defined().url('Must be a valid URL'),
  officeHoursInterestedIn: yup.array().of(yup.string().defined()).defined().nullable(),
  officeHoursCanHelpWith: yup.array().of(yup.string().defined()).defined().nullable(),
});

export const EditOfficeHoursForm = ({ onClose, member, userInfo }: Props) => {
  const router = useRouter();
  const methods = useForm<TEditOfficeHoursForm>({
    defaultValues: {
      officeHours: member.officeHours ?? '',
      officeHoursInterestedIn: member.ohInterest ?? [], // member.officeHoursInterestedIn,
      officeHoursCanHelpWith: member.ohHelpWith ?? [], // member.officeHoursCanHelpWith,
    },
    resolver: yupResolver(schema),
  });

  const isAdmin = !!(userInfo && userInfo.roles?.includes(ADMIN_ROLE));
  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMemberParams();
  const { data: memberData } = useMember(member.id);
  const { onSaveContactDetailsClicked } = useMemberAnalytics();

  const onSubmit = async (formData: TEditOfficeHoursForm) => {
    onSaveContactDetailsClicked();

    if (!memberData) {
      return;
    }

    const payload = {
      officeHours: formData.officeHours,
      ohInterest: formData.officeHoursInterestedIn,
      ohHelpWith: formData.officeHoursCanHelpWith,
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
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <EditFormControls onClose={onClose} title="Edit Office Hours" />
        <div className={s.body}>
          <div className={s.row}>
            <FormField
              name="officeHours"
              label="Office Hours"
              placeholder="Enter Office Hours link"
              description="Drop your calendar link here so others can get in touch with you at a time that is convenient. We recommend 15-min meetings scheduled."
            />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="I am iterested in:" name="officeHoursInterestedIn" warning={false} placeholder="Add topics, keywords" />
          </div>
          <div className={s.row}>
            <FormTagsInput selectLabel="I can help with:" name="officeHoursCanHelpWith" warning={false} placeholder="Add expertise, keywords" />
          </div>
        </div>
        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
