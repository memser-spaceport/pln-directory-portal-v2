import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { isMemberAvailableToConnect } from '@/utils/member.utils';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';

import s from './MemberCardBase.module.scss';

interface Props {
  member: IMember;
  teamId: string;
  className?: string;
}

export function MemberCardBase(props: PropsWithChildren<Props>) {
  const { member, teamId, className, children } = props;

  const { name, teams, profile, teamLead } = member;

  const memberTeam = teams?.find((t: ITeam) => t.id === teamId);
  const { role } = memberTeam || {};

  const isAvailableToConnect = isMemberAvailableToConnect(member);

  const defaultAvatar = useDefaultAvatar(name);
  const logo = profile || defaultAvatar;

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.left}>
        <div className={s.avatarContainer}>
          <img
            loading="lazy"
            className={s.avatar}
            alt={name}
            src={logo}
            width={40}
            height={40}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = defaultAvatar;
            }}
          />
          {teamLead && <img alt="Is team lead" src="/icons/badge/team-lead.svg" className={s.tlIcon} />}
        </div>
        <div className={s.text}>
          <div className={s.nameRole}>
            <p className={s.name}>{name}</p>
            {role && <p className={s.role}>{role}</p>}
          </div>
          {isAvailableToConnect && <OhBadge variant="secondary" />}
        </div>
      </div>

      {children && <div className={s.right}>{children}</div>}
    </div>
  );
}
