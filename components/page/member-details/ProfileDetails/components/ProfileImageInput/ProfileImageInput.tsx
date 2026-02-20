import clsx from 'clsx';
import React, { useState } from 'react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

import s from './ProfileImageInput.module.scss';
import { IMember } from '@/types/members.types';
import { toast } from '@/components/core/ToastContainer';

interface Props {
  member: Partial<IMember>;
  classes?: {
    root?: string;
    dropzoneIcon?: string;
  };
}

export const ProfileImageInput = ({ member, classes }: Props) => {
  const defaultAvatarImage = useDefaultAvatar(member?.name);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const { setValue } = useFormContext<OnboardingForm>();

  const { getInputProps, getRootProps } = useDropzone({
    onError: (err) => {
      console.log(err);
    },
    onDropRejected: (e) => {
      if (e?.length) {
        const el = e[0];
        el.errors.forEach((item) => {
          if (item.code === 'file-too-large') {
            toast.error('File is larger than 4Mb');
            return;
          }

          toast.error(item.message);
        });
      }
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

        setIsDeleted(false);
        setValue('image', file, { shouldValidate: true, shouldDirty: true });
      }
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  });

  const hasCustomImage = !!(imagePreview || (!isDeleted && member?.profile));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setIsDeleted(true);
    setValue('image', null as any, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className={clsx(s.dropzone, classes?.root)} {...getRootProps()}>
      <input {...getInputProps()} />
      <Image
        src={imagePreview || (!isDeleted && member?.profile) || defaultAvatarImage}
        alt="Preview"
        className={s.imagePreview}
        fill
      />
      <div className={s.overlay}>
        <div className={clsx(s.dropzoneHint, classes?.dropzoneIcon)}>
          <ReplaceIcon />
        </div>
        {hasCustomImage && (
          <button type="button" className={s.deleteBtn} onClick={handleDelete} aria-label="Remove image">
            <DeleteIcon />
          </button>
        )}
      </div>
    </div>
  );
};

const ReplaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0.01 3.58 0.01 8C0.01 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z"
      fill="white"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.5 0.5V1H0V3H1V14C1 14.5523 1.22386 15.0523 1.58579 15.4142C1.94772 15.7761 2.44772 16 3 16H11C11.5523 16 12.0523 15.7761 12.4142 15.4142C12.7761 15.0523 13 14.5523 13 14V3H14V1H9.5V0.5C9.5 0.223858 9.27614 0 9 0H5C4.72386 0 4.5 0.223858 4.5 0.5ZM3 3H11V14H3V3ZM4.5 5V12H6.5V5H4.5ZM7.5 5V12H9.5V5H7.5Z"
      fill="white"
    />
  </svg>
);
