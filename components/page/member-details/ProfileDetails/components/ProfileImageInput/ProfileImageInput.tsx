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

  const { getInputProps, getRootProps, open } = useDropzone({
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
    noClick: true,
    noKeyboard: true,
  });

  const hasCustomImage = !!(imagePreview || (!isDeleted && member?.profile));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setIsDeleted(true);
    setValue('image', null as any, { shouldValidate: true, shouldDirty: true });
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    open();
  };

  return (
    <div className={clsx(s.avatarContainer, classes?.root)} {...getRootProps()}>
      <input {...getInputProps()} />
      <div className={s.avatarWrapper}>
        <Image
          src={imagePreview || (!isDeleted && member?.profile) || defaultAvatarImage}
          alt="Preview"
          className={s.imagePreview}
          fill
        />
      </div>
      {hasCustomImage && (
        <button type="button" className={s.deleteBtn} onClick={handleDelete} aria-label="Remove image">
          <DeleteIcon />
        </button>
      )}
      <button
        type="button"
        className={clsx(s.replaceBtn, classes?.dropzoneIcon)}
        onClick={handleReplace}
        aria-label="Replace image"
      >
        <EditIcon />
      </button>
    </div>
  );
};

const EditIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.6338 3.15942L9.84126 0.366296C9.72518 0.250169 9.58735 0.158049 9.43566 0.095199C9.28397 0.0323489 9.12139 0 8.95719 0C8.793 0 8.63041 0.0323489 8.47872 0.095199C8.32703 0.158049 8.18921 0.250169 8.07313 0.366296L0.366255 8.0738C0.249757 8.18953 0.157394 8.32725 0.0945235 8.47895C0.0316531 8.63065 -0.000473942 8.79333 5.28325e-06 8.95755V11.7507C5.28325e-06 12.0822 0.131701 12.4001 0.366122 12.6346C0.600542 12.869 0.918485 13.0007 1.25001 13.0007H4.04313C4.20734 13.0011 4.37001 12.969 4.52171 12.9061C4.67341 12.8432 4.81112 12.7509 4.92688 12.6344L12.6338 4.92692C12.8681 4.69251 12.9997 4.37463 12.9997 4.04317C12.9997 3.71172 12.8681 3.39383 12.6338 3.15942ZM3.93751 11.5007H1.50001V9.06317L6.75 3.81317L9.18751 6.25067L3.93751 11.5007ZM10.25 5.18817L7.8125 2.75067L8.95875 1.60442L11.3963 4.04192L10.25 5.18817Z"
      fill="#455468"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.75 2.5H9.5V1.75C9.5 1.28587 9.31563 0.840752 8.98744 0.512563C8.65925 0.184374 8.21413 0 7.75 0H4.75C4.28587 0 3.84075 0.184374 3.51256 0.512563C3.18437 0.840752 3 1.28587 3 1.75V2.5H0.75C0.551088 2.5 0.360322 2.57902 0.21967 2.71967C0.0790177 2.86032 0 3.05109 0 3.25C0 3.44891 0.0790177 3.63968 0.21967 3.78033C0.360322 3.92098 0.551088 4 0.75 4H1V12.5C1 12.8315 1.1317 13.1495 1.36612 13.3839C1.60054 13.6183 1.91848 13.75 2.25 13.75H10.25C10.5815 13.75 10.8995 13.6183 11.1339 13.3839C11.3683 13.1495 11.5 12.8315 11.5 12.5V4H11.75C11.9489 4 12.1397 3.92098 12.2803 3.78033C12.421 3.63968 12.5 3.44891 12.5 3.25C12.5 3.05109 12.421 2.86032 12.2803 2.71967C12.1397 2.57902 11.9489 2.5 11.75 2.5ZM4.5 1.75C4.5 1.6837 4.52634 1.62011 4.57322 1.57322C4.62011 1.52634 4.6837 1.5 4.75 1.5H7.75C7.8163 1.5 7.87989 1.52634 7.92678 1.57322C7.97366 1.62011 8 1.6837 8 1.75V2.5H4.5V1.75ZM10 12.25H2.5V4H10V12.25ZM5.5 6V10C5.5 10.1989 5.42098 10.3897 5.28033 10.5303C5.13968 10.671 4.94891 10.75 4.75 10.75C4.55109 10.75 4.36032 10.671 4.21967 10.5303C4.07902 10.3897 4 10.1989 4 10V6C4 5.80109 4.07902 5.61032 4.21967 5.46967C4.36032 5.32902 4.55109 5.25 4.75 5.25C4.94891 5.25 5.13968 5.32902 5.28033 5.46967C5.42098 5.61032 5.5 5.80109 5.5 6ZM8.5 6V10C8.5 10.1989 8.42098 10.3897 8.28033 10.5303C8.13968 10.671 7.94891 10.75 7.75 10.75C7.55109 10.75 7.36032 10.671 7.21967 10.5303C7.07902 10.3897 7 10.1989 7 10V6C7 5.80109 7.07902 5.61032 7.21967 5.46967C7.36032 5.32902 7.55109 5.25 7.75 5.25C7.94891 5.25 8.13968 5.32902 8.28033 5.46967C8.42098 5.61032 8.5 5.80109 8.5 6Z"
      fill="#455468"
    />
  </svg>
);
