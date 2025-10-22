'use client';

import React from 'react';
import { clsx } from 'clsx';

import { FileUploader } from '@/components/ui/FileUploader';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import s from './VideoPitchView.module.scss';

interface Props {
  isLoggedIn: boolean;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit: () => void;
}

export const VideoPitchView = (props: Props) => {
  const { isLoggedIn, isEditable, showIncomplete, onEdit } = props;

  const handleUpload = (files: File[]) => {
    console.log('Uploaded files:', files);
  };

  return (
    <>
      {showIncomplete && (
        <DataIncomplete className={s.incompleteStrip}>
          To participate in Demo Day, you must upload Video Pitch. Profiles without these will not be shown to
          investors.
        </DataIncomplete>
      )}

      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h3 className={s.title}>Video Pitch</h3>
          {isEditable && <EditButton onClick={onEdit} />}
        </div>

        <div className={s.content}>
          <div className={s.section}>
            <div className={s.col}>
              <p className={s.description}>
                Record a short pitch video (up to 5 minutes). This will be available to investors on Demo Day alongside
                your one-pager. Keep it engaging — cover your team, problem, solution, traction, and fundraising ask.
              </p>
              <FileUploader
                title="Upload 5-Minute Pitch Video"
                description="Supported: MP4 upload or YouTube/Vimeo link."
                supportedFormats={['MP4']}
                maxFiles={1}
                maxFileSize={500}
                onUpload={handleUpload}
                showVideoPreview={true}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
