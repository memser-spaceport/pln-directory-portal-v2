import React, { useState } from 'react';
import Image from 'next/image';
import { Field } from '@base-ui-components/react/field';
import { motion } from 'framer-motion';

import { IUserInfo } from '@/types/shared.types';

import s from './ProfileStep.module.scss';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { clsx } from 'clsx';

interface Props {
  userInfo: IUserInfo;
}

export const ProfileStep = ({ userInfo }: Props) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const defaultPreview = useDefaultAvatar(userInfo.name);

  const {
    setValue,
    register,
    formState: { errors },
  } = useFormContext<OnboardingForm>();

  const { getInputProps, getRootProps } = useDropzone({
    onError: (err) => {
      console.error(err);
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
    <motion.div className={s.root} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Image src={imagePreview ?? defaultPreview} alt="Preview" width={80} height={80} className={s.imagePreview} />
      <div className={s.title}>Let’s get to know you</div>
      <div className={s.subtitle}>Update your name, email and a photo so members can find you easily.</div>

      <div className={s.dropzone} {...getRootProps()}>
        <input {...getInputProps()} />
        <div className={s.dropzoneHint}>
          {imagePreview ? 'To change drop new here or' : 'Drop your pic here or'} <span>browse</span>
          <p className={s.uploadRulesHint}>Upload a PNG or JPEG up to 4 MB.</p>
        </div>
      </div>

      <Field.Root className={s.field}>
        <Field.Label className={s.label}>Name</Field.Label>
        <Field.Control
          {...register('name')}
          placeholder="User Name"
          className={clsx(s.input, {
            [s.error]: !!errors.name,
          })}
        />
        <Field.Error className={s.errorMsg} match={!!errors.name}>
          {errors.name?.message}
        </Field.Error>
      </Field.Root>

      <Field.Root className={s.field}>
        <Field.Label className={s.label}>Email</Field.Label>
        <Field.Control
          {...register('email')}
          placeholder="User@mail.com"
          className={clsx(s.input, {
            [s.error]: !!errors.email,
          })}
        />
        <Field.Error className={s.errorMsg} match={!!errors.email}>
          {errors.email?.message}
        </Field.Error>
      </Field.Root>
    </motion.div>
  );
};
