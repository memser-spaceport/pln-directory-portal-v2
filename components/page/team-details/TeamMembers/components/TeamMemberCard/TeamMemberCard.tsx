import { Fragment } from 'react';

import { IMember } from '@/types/members.types';
import { ITag, ITeam } from '@/types/teams.types';

import { isMemberAvailableToConnect } from '@/utils/member.utils';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { Tag } from '@/components/ui/Tag';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import s from './TeamMemberCard.module.scss';

interface Props {
  team: ITeam | undefined;
  member: IMember;
  url: string;
  onCardClick: (member: IMember) => void;
}

export function TeamMemberCard(props: Props) {
  const { team, member, url, onCardClick } = props;

  const memberName = member?.name ?? '';
  const role = team?.role ?? '';
  const skills = member?.skills ?? [];
  const isTeamLead = member?.teamLead;
  const defaultAvatarImage = useDefaultAvatar(member?.name);
  const logo = member?.profile || defaultAvatarImage;
  const isAvailableToConnect = isMemberAvailableToConnect(member);

  return (
    <a target="_blank" href={url} onClick={() => onCardClick(member)}>
      <div className={s.root}>
        <div className={s.profileDetails}>
          <div className={s.profile}>
            <div className={s.profileContainer}>
              {isTeamLead && (
                <Tooltip
                  side="top"
                  asChild
                  trigger={
                    <div>
                      <img
                        alt="lead"
                        loading="lazy"
                        className={s.leadBadge}
                        height={16}
                        width={16}
                        src="/icons/badge/team-lead.svg"
                      />
                    </div>
                  }
                  content={'Team Lead'}
                />
              )}
              <img
                loading="lazy"
                className={s.profileImage}
                alt="profile"
                src={logo}
                width={40}
                height={40}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultAvatarImage;
                }}
              />
            </div>
            <div className={s.nameRole}>
              <Tooltip
                asChild
                trigger={<h2 className={s.name}>{memberName}</h2>}
                content={memberName}
              />
              <Tooltip
                asChild
                trigger={<p className={s.role}>{role}</p>}
                content={role}
              />
              {isAvailableToConnect && <OhBadge variant="secondary" />}
            </div>
          </div>
        </div>

        <div className={s.skills}>
          {skills?.slice(0, 3).map((skill: ITag, index: number) => (
            <Fragment key={`${skill} + ${index}`}>
              <div className={s.skill}>
                <Tooltip
                  asChild
                  trigger={
                    <div>
                      <Tag value={skill?.title} />{' '}
                    </div>
                  }
                  content={skill?.title}
                />
              </div>
            </Fragment>
          ))}
          {skills?.length > 3 && (
            <Tooltip
              asChild
              trigger={
                <div>
                  <Tag value={'+' + (skills?.length - 3).toString()} />
                </div>
              }
              content={
                <div>
                  {skills?.slice(3, skills?.length)?.map((skill, index) => (
                    <div key={`${skill} + ${skill} + ${index}`}>
                      {skill?.title}
                      {index !== skills?.slice(3, skills?.length - 1)?.length ? ',' : ''}
                    </div>
                  ))}
                </div>
              }
            />
          )}
        </div>

        <div className={s.arrow}>
          <button type="button" className={s.arrowButton}>
            <img loading="lazy" alt="goto" src="/icons/right-arrow-gray.svg" height={16} width={16} />
          </button>
        </div>
      </div>
    </a>
  );
}
