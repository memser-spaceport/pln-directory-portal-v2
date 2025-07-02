import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

import s from './ProfileImageInput.module.scss';
import clsx from 'clsx';

export const ProfileImageInput = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      'image/jpg': ['.jpg', '.jpeg'],
    },
  });

  return (
    <div className={s.dropzone} {...getRootProps()}>
      <input {...getInputProps()} />
      {imagePreview && <Image src={imagePreview} alt="Preview" className={s.imagePreview} fill />}
      <div
        className={clsx(s.dropzoneHint, {
          [s.withPreview]: !!imagePreview,
        })}
      >
        <EditIcon />
        Add Image
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 5.125C16.0453 5.17148 17.6723 6.79844 17.7188 8.84375C17.7188 10.9355 16.0453 12.5625 14 12.5625C11.9082 12.5625 10.2812 10.9355 10.2812 8.84375C10.2812 6.79844 11.9082 5.125 14 5.125ZM14 10.3312C14.7902 10.3312 15.4875 9.68047 15.4875 8.84375C15.4875 8.05352 14.7902 7.35625 14 7.35625C13.1633 7.35625 12.5125 8.05352 12.5125 8.84375C12.5125 9.68047 13.1633 10.3312 14 10.3312ZM26.8762 14.7937C27.2016 15.3051 27.3875 15.8629 27.3875 16.4672V18.5125C27.3875 20.1859 26.0395 21.4875 24.4125 21.4875H3.5875C1.91406 21.4875 0.612499 20.1859 0.612499 18.5125V16.4672C0.612499 15.8629 0.751952 15.3051 1.07734 14.7937L3.5875 11.075V3.6375C3.5875 2.01055 4.88906 0.662499 6.5625 0.662499H21.4375C23.0645 0.662499 24.4125 2.01055 24.4125 3.6375V11.075L26.8762 14.7937ZM5.81875 11.7723L3.77344 14.7937H24.1801L22.1813 11.7723V3.6375C22.1813 3.26562 21.8094 2.89375 21.4375 2.89375H6.5625C6.14414 2.89375 5.81875 3.26562 5.81875 3.6375V11.7723ZM24.4125 19.2562C24.7844 19.2562 25.1563 18.9309 25.1563 18.5125V17.025H2.84375V18.5125C2.84375 18.9309 3.16914 19.2562 3.5875 19.2562H24.4125ZM20.3219 4.38125C20.5078 4.38125 20.6938 4.56719 20.6938 4.75312V6.24062C20.6938 6.47305 20.5078 6.6125 20.3219 6.6125H18.8344C18.602 6.6125 18.4625 6.47305 18.4625 6.24062V4.75312C18.4625 4.56719 18.602 4.38125 18.8344 4.38125H20.3219Z"
      fill="#156FF7"
    />
  </svg>
);
