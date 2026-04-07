import clsx from 'clsx';

import { IMember } from '@/types/members.types';

import { PAGE_ROUTES } from '@/utils/constants';

import { MemberCardBase } from '../../../MemberCardBase';
import { SkillsList } from '../../../SkillsList/SkillsList';

import s from './TeamMembersViewCard.module.scss';

interface Props {
  member: IMember;
  teamId: string;
  showBorder: boolean;
  hasEditAccess: boolean;
  onClick: (member: IMember) => void;
  onEdit: (member: IMember) => void;
}

export function TeamMembersViewCard(props: Props) {
  const { member, teamId, showBorder, hasEditAccess, onClick, onEdit } = props;

  return (
    <a target="_blank" className={s.root} onClick={() => onClick(member)} href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}>
      <MemberCardBase
        member={member}
        teamId={teamId}
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
