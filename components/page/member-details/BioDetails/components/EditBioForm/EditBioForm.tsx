'use client';

import React, { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { EditFormControls } from '@/components/page/member-details/components/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';
import { useMember } from '@/services/members/hooks/useMember';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/core/ToastContainer';
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
  const originalAiContentRef = useRef<string | null>(null);
  const initialBioRef = useRef<string>(member.bio || '');
  
  const methods = useForm<FormData>({
    defaultValues: {
      bio: member.bio || '',
    },
    resolver: yupResolver(bioSchema),
  });

  const { handleSubmit, reset, watch } = methods;
  const { mutateAsync } = useUpdateMemberParams();
  const { data: memberData } = useMember(member.id);
  const { onSaveProfileDetailsClicked } = useMemberAnalytics();

  const handleAiContentGenerated = (originalContent: string) => {
    // Store the original content as-is for now
    // We'll capture the RichTextEditor's processed version after it renders
    originalAiContentRef.current = originalContent;
    
    // Use a small delay to capture the processed content after RichTextEditor normalizes it
    setTimeout(() => {
      const currentBio = watch('bio');
      if (currentBio) {
        // Now store the RichTextEditor's processed version
        originalAiContentRef.current = currentBio;
      }
    }, 100);
  };

  const modifyDisclaimerIfNeeded = (currentBio: string): string => {
    // Check if this bio contains the original AI disclaimer (indicating it's AI-generated)
    const originalDisclaimer = '<p><em>Bio is AI generated &amp; may not be accurate.</em></p>';
    const newDisclaimer = '<p><em>Bio is AI generated.</em></p>';
    const hasOriginalDisclaimer = currentBio.includes(originalDisclaimer);

    // Case 1: New AI content was just generated in this session
    if (originalAiContentRef.current) {
      if (currentBio === originalAiContentRef.current) {
        return currentBio;
      }

      if (hasOriginalDisclaimer) {
        return currentBio.replace(originalDisclaimer, newDisclaimer);
      }
    }
    
    // Case 2: Editing existing AI-generated bio (no new generation in this session)
    else if (hasOriginalDisclaimer) {
      if (currentBio !== initialBioRef.current) {
        return currentBio.replace(originalDisclaimer, newDisclaimer);
      }
    }
    
    return currentBio;
  };

  const onSubmit = async (formData: FormData) => {
    onSaveProfileDetailsClicked();

    if (!memberData) {
      return;
    }

    const payload = {
      bio: modifyDisclaimerIfNeeded(formData.bio),
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
            <BioInput generateBio={generateBio} onAiContentGenerated={handleAiContentGenerated} />
          </div>
        </div>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
};
