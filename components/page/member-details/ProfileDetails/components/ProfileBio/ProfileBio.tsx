import React from 'react';

import s from './ProfileBio.module.scss';

interface Props {
  bio: string | undefined;
  isEditable: boolean;
}

export const ProfileBio = ({ bio, isEditable }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.label}>Bio</div>
      <div className={s.body}>
        {bio ? (
          <div dangerouslySetInnerHTML={{ __html: bio }} />
        ) : (
          <div className={s.row}>
            <p>Tell who you are and what you do. A clear bio helps others understand you and connect better.</p>
            {isEditable && <button className={s.btn}>Gen Bio with AI</button>}
          </div>
        )}
      </div>
    </div>
  );
};
