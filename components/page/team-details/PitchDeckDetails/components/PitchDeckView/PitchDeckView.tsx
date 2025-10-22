'use client';

import React from 'react';
import { clsx } from 'clsx';

import { FileUploader } from '@/components/ui/FileUploader';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';

import s from './PitchDeckView.module.scss';

interface Props {
  isLoggedIn: boolean;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
}

export const PitchDeckView = (props: Props) => {
  const { isLoggedIn, isEditable, showIncomplete, onEdit } = props;

  const handleUpload = (files: File[]) => {
    console.log('Uploaded files:', files);
  };

  return (
    <>
      {showIncomplete && (
        <DataIncomplete className={s.incompleteStrip}>
          To participate in Demo Day, you must upload Pitch Slide. Profiles without these will not be shown to
          investors.
        </DataIncomplete>
      )}

      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h3 className={s.title}>Pitch Slide</h3>
          {isEditable && <EditButton onClick={onEdit} />}
        </div>

        <div className={s.content}>
          <div className={s.section}>
            <div className={s.col}>
              <p className={s.description}>
                Your one-page pitch slide will be visible to whitelisted investors during Demo Day. Use it to highlight
                your team, product, traction, and fundraising needs in a concise format.
              </p>
              <FileUploader
                title="Upload Your Pitch Slide"
                description="Accepted format: PDF, max 1 slide only, up to 5MB."
                supportedFormats={['PDF']}
                maxFiles={1}
                maxFileSize={5}
                onUpload={handleUpload}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
