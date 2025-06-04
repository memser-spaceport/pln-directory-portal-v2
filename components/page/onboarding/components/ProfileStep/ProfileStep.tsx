import React, { useState } from 'react';
import Image from 'next/image';

import { IUserInfo } from '@/types/shared.types';
import { useOnboardingState } from '@/services/onboarding/store';

import s from './ProfileStep.module.scss';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useDropzone } from 'react-dropzone';

interface Props {
  userInfo: IUserInfo;
}

export const ProfileStep = ({ userInfo }: Props) => {
  const {
    actions: { setStep },
  } = useOnboardingState();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const defaultPreview = useDefaultAvatar(userInfo.name);

  const { getInputProps, getRootProps } = useDropzone();

  return (
    <div className={s.root}>
      <Image src={imagePreview ?? defaultPreview} alt="Preview" width={80} height={80} className={s.imagePreview} />
      <div className={s.title}>Let’s get to know you</div>
      <div className={s.subtitle}>Update your name, email and a photo so members can find you easily.</div>

      <div className={s.dropzone} {...getRootProps()}>
        <input {...getInputProps()} />
        <div className={s.dropzoneHint}>
          Drop your pic here or <span>browse</span>
        </div>
      </div>
      <button className={s.actionButton} onClick={() => setStep('profile')}>
        Let&apos;s go!
      </button>
    </div>
  );
};
