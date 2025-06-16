import React from 'react';

import s from './ProfileBio.module.scss';
import clsx from 'clsx';

interface Props {
  bio: string | undefined;
  isEditable: boolean;
  hasMissingData?: boolean;
  onEdit?: () => void;
}

export const ProfileBio = ({ bio, isEditable, hasMissingData, onEdit }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.label}>Bio</div>
      <div
        className={clsx(s.body, {
          [s.missingData]: hasMissingData,
        })}
      >
        {bio ? (
          <div dangerouslySetInnerHTML={{ __html: bio }} />
        ) : (
          <div className={s.row}>
            <p>Tell who you are and what you do. A clear bio helps others understand you and connect better.</p>
            {isEditable && (
              <button className={s.btn} onClick={onEdit}>
                Gen Bio with AI
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
