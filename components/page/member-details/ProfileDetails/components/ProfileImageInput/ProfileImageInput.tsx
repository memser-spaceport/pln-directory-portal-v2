import React, { useState } from 'react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

import s from './ProfileImageInput.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { useMember } from '@/services/members/hooks/useMember';

interface Props {
  userInfo: IUserInfo;
}

export const ProfileImageInput = ({ userInfo }: Props) => {
  const defaultAvatarImage = useDefaultAvatar(userInfo?.name);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { data: memberData } = useMember(userInfo.uid);
  const { setValue } = useFormContext<OnboardingForm>();

  const { getInputProps, getRootProps } = useDropzone({
    onError: (err) => {
      console.log(err);
    },
    onDrop: (acceptedFiles) => {
      console.log(acceptedFiles);
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };

        reader.readAsDataURL(file);

        setValue('image', file, { shouldValidate: true, shouldDirty: true });
      }
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
    accept: {
      'image/png': ['.png'],
      'image/jpg': ['.jpg'],
    },
  });

  return (
    <div className={s.dropzone} {...getRootProps()}>
      <input {...getInputProps()} />
      <Image src={imagePreview || memberData?.memberInfo?.image?.url || defaultAvatarImage} alt="Preview" className={s.imagePreview} fill />
      <div className={s.dropzoneHint}>
        <EditIcon />
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.1992 1.43359C10.9648 0.667969 12.1953 0.667969 12.9609 1.43359L13.3164 1.78906C14.082 2.55469 14.082 3.78516 13.3164 4.55078L7.90234 9.96484C7.68359 10.1836 7.38281 10.375 7.05469 10.457L4.32031 11.25C4.10156 11.3047 3.85547 11.25 3.69141 11.0586C3.5 10.8945 3.44531 10.6484 3.5 10.4297L4.29297 7.69531C4.375 7.36719 4.56641 7.06641 4.78516 6.84766L10.1992 1.43359ZM12.0312 2.36328C11.7852 2.11719 11.375 2.11719 11.1289 2.36328L10.3086 3.15625L11.5938 4.44141L12.3867 3.62109C12.6328 3.375 12.6328 2.96484 12.3867 2.71875L12.0312 2.36328ZM5.55078 8.05078L5.08594 9.66406L6.69922 9.19922C6.80859 9.17188 6.89062 9.11719 6.97266 9.03516L10.6641 5.34375L9.40625 4.08594L5.71484 7.77734C5.63281 7.85938 5.57812 7.94141 5.55078 8.05078ZM5.46875 2.5C5.82422 2.5 6.125 2.80078 6.125 3.15625C6.125 3.53906 5.82422 3.8125 5.46875 3.8125H2.40625C1.77734 3.8125 1.3125 4.30469 1.3125 4.90625V12.3438C1.3125 12.9727 1.77734 13.4375 2.40625 13.4375H9.84375C10.4453 13.4375 10.9375 12.9727 10.9375 12.3438V9.28125C10.9375 8.92578 11.2109 8.625 11.5938 8.625C11.9492 8.625 12.25 8.92578 12.25 9.28125V12.3438C12.25 13.6836 11.1562 14.75 9.84375 14.75H2.40625C1.06641 14.75 0 13.6836 0 12.3438V4.90625C0 3.59375 1.06641 2.5 2.40625 2.5H5.46875Z"
      fill="white"
    />
  </svg>
);
