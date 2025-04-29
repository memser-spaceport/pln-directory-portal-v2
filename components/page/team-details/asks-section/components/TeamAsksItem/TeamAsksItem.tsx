import React, { FC } from 'react';
import { ITeamAsk } from '@/types/teams.types';

import s from './TeamAsksItem.module.css';
import { EditAskDialog } from '@/components/core/edit-ask-dialog';

interface Props {
  data: ITeamAsk;
  canEdit: boolean;
}

export const TeamAsksItem: FC<Props> = ({ data, canEdit }) => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <p className={s.title}>{data.title}</p>
        {canEdit && <EditAskDialog />}
      </div>
      <div className={s.content} dangerouslySetInnerHTML={{ __html: data.description }} />
      <div className={s.tags}>
        {data?.tags?.map((tag: string, index: number) => (
          <div key={`${tag}+${index}`} className={s.tag}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};
