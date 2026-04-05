import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

import { PAGE_ROUTES } from '@/utils/constants';
import { isMemberAvailableToConnect } from '@/utils/member.utils';

import { MemberCardBase } from '../../../MemberCardBase';
import { SkillsList } from '../../../SkillsList/SkillsList';

import s from './TeamMembersViewCard.module.scss';
import clsx from 'clsx';

interface Props {
  member: IMember;
  teamId: string | undefined;
  showBorder: boolean;
  hasEditAccess: boolean;
  onClick: (member: IMember) => void;
  onEdit: (member: IMember) => void;
}

export function TeamMembersViewCard(props: Props) {
  const { member, teamId, showBorder, hasEditAccess, onClick, onEdit } = props;

  const memberTeam = member?.teams?.find((t: ITeam) => t.id === teamId);
  const isAvailable = isMemberAvailableToConnect(member);

  return (
    <a target="_blank" className={s.root} onClick={() => onClick(member)} href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}>
      <MemberCardBase
        name={member.name}
        role={memberTeam?.role}
        image={member.profile}
        isAvailableToConnect={isAvailable}
        className={clsx(s.member, {
          [s.memberBorder]: showBorder,
        })}
      >
        <div className={s.skills}>
          <SkillsList skills={member?.skills ?? []} />
        </div>

        <div className={s.actionIcon}>
          {hasEditAccess ? (
            <button
              type="button"
              className={s.editButton}
              onClick={(e) => {
                e.preventDefault();
                onEdit(member);
              }}
            >
              <img className={s.edit} loading="lazy" src="/icons/edit-chat.svg" />
            </button>
          ) : (
            <img loading="lazy" alt="goto" src="/icons/right-arrow-gray.svg" height={16} width={16} />
          )}
        </div>
      </MemberCardBase>
    </a>
  );
}
