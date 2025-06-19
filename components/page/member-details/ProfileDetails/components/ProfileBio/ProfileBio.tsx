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
            <p>Tell others who you are, what you’re working on, and what you’re looking to connect around.</p>
            {isEditable && (
              <button className={s.btn} onClick={onEdit}>
                Gen Bio <span className={s.desktopOnly}>with AI</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
