import React from 'react';
import TextEditor from '@/components/ui/text-editor';
import { useFormContext } from 'react-hook-form';

import s from './ProfileBioInput.module.scss';
import { useGenerateBioWithAi } from '@/services/members/hooks/useGenerateBioWithAi';
import { clsx } from 'clsx';

export const ProfileBioInput = () => {
  const { watch, setValue } = useFormContext();
  const { bio } = watch();

  const { mutateAsync, isPending } = useGenerateBioWithAi();

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

            setValue('bio', res.bio, { shouldValidate: true });
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
      <TextEditor id="member-bio" text={bio} setContent={(txt) => setValue('bio', txt, { shouldValidate: true })} height={200} isToolbarSticky statusBar={false} />
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;
