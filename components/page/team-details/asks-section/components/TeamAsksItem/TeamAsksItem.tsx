import React, { FC, useEffect, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const links = contentRef.current?.querySelectorAll('a');

    links?.forEach((link) => {
      link.setAttribute('class', s.link);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer'); // for security
    });
  }, [data.description]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.titleWrapper}>
          <p className={s.title}>{data.title}</p>
          {data.status === 'CLOSED' && <div className={s.reasonBadge}>{data.closedReason}</div>}
        </div>

        {canEdit && <AskActionsMenu team={team} ask={data} deleteOnly={data.status === 'CLOSED'} />}
      </div>
      <div ref={contentRef} className={s.content} dangerouslySetInnerHTML={{ __html: data.description }} />
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
