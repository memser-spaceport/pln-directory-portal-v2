'use client';

import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { useMember } from '@/services/members/hooks/useMember';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { BioInput } from '@/components/page/member-details/BioDetails/components/BioInput';

import { useUpdateMemberParams } from '@/services/members/hooks/useUpdateMemberParams';

import s from './EditBioForm.module.scss';

interface Props {
  onClose: () => void;
  member: IMember;
  userInfo: IUserInfo;
  generateBio?: boolean;
}

interface FormData {
  bio: string;
}

const bioSchema = yup.object().shape({
  bio: yup.string().max(2000, 'Bio must be less than 2000 characters').defined(),
});

export const EditBioForm = ({ onClose, member, userInfo, generateBio }: Props) => {
  const router = useRouter();
  const methods = useForm<FormData>({
    defaultValues: {
      bio: member.bio || '',
    },
    resolver: yupResolver(bioSchema),
  });

  const { handleSubmit, reset } = methods;
  const { mutateAsync } = useUpdateMemberParams();
  const { data: memberData } = useMember(member.id);
  const { onSaveProfileDetailsClicked } = useMemberAnalytics();

  const onSubmit = async (formData: FormData) => {
    onSaveProfileDetailsClicked();

    if (!memberData) {
      return;
    }

    const payload = {
      bio: formData.bio,
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
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
          }
        }}
      >
        <EditFormControls onClose={onClose} title="Edit Bio" />

        <div className={s.body}>
          <div className={s.row}>
            <BioInput generateBio={generateBio} />
          </div>
        </div>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
