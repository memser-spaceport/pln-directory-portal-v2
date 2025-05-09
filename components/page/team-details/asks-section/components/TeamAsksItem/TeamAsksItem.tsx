import React, { FC } from 'react';
import { ITeam, ITeamAsk } from '@/types/teams.types';

import s from './TeamAsksItem.module.css';
import { EditAskDialog } from '@/components/core/edit-ask-dialog';
import { AskActionsMenu } from '@/components/page/team-details/asks-section/components/AskActionsMenu';

interface Props {
  data: ITeamAsk;
  canEdit: boolean;
  team: ITeam;
}

export const TeamAsksItem: FC<Props> = ({ data, canEdit, team }) => {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.titleWrapper}>
          <p className={s.title}>{data.title}</p>
          {data.status === 'CLOSED' && <div className={s.reasonBadge}>{data.closedReason}</div>}
        </div>

        {canEdit && data.status !== 'CLOSED' && <AskActionsMenu team={team} ask={data} />}
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
