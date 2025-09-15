'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { useGenerateBioWithAi } from '@/services/members/hooks/useGenerateBioWithAi';

import s from './BioInput.module.scss';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor/RichTextEditor'), { ssr: false });

interface Props {
  generateBio?: boolean;
  onAiContentGenerated?: (originalContent: string) => void;
}

export const BioInput = ({ generateBio, onAiContentGenerated }: Props) => {
  const { watch, setValue } = useFormContext();
  const { bio } = watch();
  const generateBioRef = useRef(false);

  const { mutateAsync, isPending, reset } = useGenerateBioWithAi();

  useEffect(() => {
    async function prefillBio() {
      const res = await mutateAsync();

      reset();

      if (!res.bio) {
        return;
      }

      setValue('bio', res.bio, { shouldValidate: true, shouldDirty: true });
      onAiContentGenerated?.(res.bio);
    }

    if (generateBio && !generateBioRef.current) {
      generateBioRef.current = true;
      prefillBio();
    }
  }, [generateBio, mutateAsync, onAiContentGenerated, reset, setValue]);

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
            onAiContentGenerated?.(res.bio);
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

      <RichTextEditor value={bio} onChange={(txt) => setValue('bio', txt, { shouldValidate: true, shouldDirty: true })} className={s.editor} />
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;
