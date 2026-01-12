import React from 'react';
import { clsx } from 'clsx';
import Image from 'next/image';

import { Attendee } from '@/components/core/UpdatesPanel/NotificationItem/components/AttendeesRow/types';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import s from './AvatarGroup.module.scss';

interface Props {
  attendees: Attendee[];
  classes?: {
    root?: string;
  };
}

export function AvatarGroup(props: Props) {
  const { attendees, classes } = props;

  return (
    <div className={clsx(s.root, classes?.root)}>
      {attendees.slice(0, 3).map((attendee, index) => {
        const { uid, picture } = attendee;

        return (
          <div key={uid || index} className={s.avatar}>
            <Image alt="" width={20} height={20} className={s.img} src={picture || getDefaultAvatar(uid || '')} />
          </div>
        );
      })}
    </div>
  );
}
