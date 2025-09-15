'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { useGenerateBioWithAi } from '@/services/members/hooks/useGenerateBioWithAi';

import s from './BioInput.module.scss';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor/RichTextEditor'), { ssr: false });

const disclaimerNew = '<p><em>Bio is AI generated &amp; may not be accurate.</em></p>';
const disclaimerEdit = '<p><em>Bio is AI generated.</em></p>';

interface Props {
  generateBio?: boolean;
}

export const BioInput = ({ generateBio }: Props) => {
  const { watch, setValue } = useFormContext();
  const { bio } = watch();
  const generateBioRef = useRef(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const { mutateAsync, isPending, reset } = useGenerateBioWithAi();

  // Check if the bio already contains AI disclaimer on the mount
  useEffect(() => {
    if (bio && (bio.includes(disclaimerNew) || bio.includes(disclaimerEdit))) {
      setIsAiGenerated(true);
    }
  }, [bio]);

  useEffect(() => {
    async function prefillBio() {
      const res = await mutateAsync();

      reset();

      if (!res.bio) {
        return;
      }

      setValue('bio', res.bio, { shouldValidate: true, shouldDirty: true });
      setIsAiGenerated(true);
      setHasUserEdited(false);
    }

    if (generateBio && !generateBioRef.current) {
      generateBioRef.current = true;
      prefillBio();
    }
  }, [generateBio, mutateAsync, reset, setValue]);

  // Add a function to update disclaimer when user finishes editing
  const updateDisclaimerIfNeeded = (txt: string) => {
    if (isAiGenerated && !hasUserEdited && txt.includes(disclaimerNew)) {
      const bioWithoutDisclaimer = txt.replace(disclaimerNew, '');
      const originalBioWithoutDisclaimer = bio.replace(disclaimerNew, '').replace(disclaimerEdit, '');
      
      if (bioWithoutDisclaimer !== originalBioWithoutDisclaimer) {
        setHasUserEdited(true);
        return txt.replace(disclaimerNew, disclaimerEdit);
      }
    }
    return txt;
  };

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
            setIsAiGenerated(true);
            setHasUserEdited(false);
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
        onChange={(txt) => {
          setValue('bio', txt, { shouldValidate: true, shouldDirty: true });
          
          // Mark as edited if a user changed the content (but don't update the disclaimer yet)
          if (isAiGenerated && !hasUserEdited && txt.includes(disclaimerNew)) {
            const bioWithoutDisclaimer = txt.replace(disclaimerNew, '');
            const originalBioWithoutDisclaimer = bio.replace(disclaimerNew, '').replace(disclaimerEdit, '');
            
            if (bioWithoutDisclaimer !== originalBioWithoutDisclaimer) {
              // Mark as edited but update disclaimer later (when they submit or blur)
              setHasUserEdited(true);
            }
          }
        }}
        className={s.editor}
      />
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;
