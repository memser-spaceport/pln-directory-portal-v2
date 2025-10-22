'use client';

import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import s from './ProfileBioInput.module.scss';
import { useGenerateBioWithAi } from '@/services/members/hooks/useGenerateBioWithAi';
import { clsx } from 'clsx';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

interface Props {
  generateBio?: boolean;
}

export const ProfileBioInput = ({ generateBio }: Props) => {
  const { watch, setValue } = useFormContext();
  const { bio } = watch();
  const generateBioRef = useRef(false);

  const { mutateAsync, isPending, status, isSuccess, reset } = useGenerateBioWithAi();

  useEffect(() => {
    async function prefillBio() {
      const res = await mutateAsync();

      reset();

      if (!res.bio) {
        return;
      }

      setValue('bio', res.bio, { shouldValidate: true, shouldDirty: true });
    }

    if (generateBio && !generateBioRef.current) {
      generateBioRef.current = true;
      prefillBio();
    }
  }, [generateBio, mutateAsync, reset, setValue]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.label}>Bio</span>
        <button
          type="button"
          className={clsx(s.genButton, {
            [s.loading]: isPending,
          })}
          disabled={isPending}
          onClick={async () => {
            const res = await mutateAsync();

            if (!res.bio) {
              return;
            }

            setValue('bio', res.bio, { shouldValidate: true, shouldDirty: true });
          }}
        >
          {isPending ? (
            <>
              <LoaderIcon /> Processing...
            </>
          ) : (
            <>Gen Bio with AI</>
          )}
        </button>
      </div>

      <RichTextEditor
        value={bio}
        onChange={(txt) => setValue('bio', txt, { shouldValidate: true, shouldDirty: true })}
      />
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;
