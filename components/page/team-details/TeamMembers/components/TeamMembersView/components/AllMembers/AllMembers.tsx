import { ChangeEvent, useEffect, useState } from 'react';

import { IMember } from '@/types/members.types';

import { EVENTS } from '@/utils/constants';

import { SearchIcon } from './icons';
import { TeamMembersViewCard } from '../TeamMembersViewCard';

import s from './AllMembers.module.scss';

interface Props {
  members: IMember[];
  teamId: string;
  hasEditAccess: boolean;
  onCardClick: (member: IMember) => void;
  onEditMember: (member: IMember) => void;
}

export function AllMembers(props: Props) {
  const { teamId, members = [], hasEditAccess, onCardClick, onEditMember } = props;

  const [allMembers, setAllMembers] = useState(members);
  const [searchValue, setSearchValue] = useState('');

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchValue(name);
    if (name) {
      const filteredMembers = allMembers?.filter((member: IMember) => member?.name?.toLowerCase()?.includes(name));
      setAllMembers(filteredMembers);
    } else {
      setAllMembers(members);
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.TEAM_DETAIL_ALL_MEMBERS_CLOSE, (e: any) => {
      setAllMembers(members);
      setSearchValue('');
    });
    document.removeEventListener(EVENTS.TRIGGER_LOADER, () => {});
  }, []);

  return (
    <div className={s.root}>
      <h2 className={s.title}>Members ({members?.length})</h2>
      <div className={s.searchBar}>
        <SearchIcon />
        <input
          value={searchValue}
          className={s.searchInput}
          placeholder="Search"
          name="name"
          autoComplete="off"
          onChange={onInputChangeHandler}
        />
      </div>

      <div className={s.divider} />

      <div className={s.members}>
        {allMembers?.map((member: IMember, index: number) => (
          <TeamMembersViewCard
            key={member.id ?? index}
            member={member}
            teamId={teamId}
            showBorder={index < allMembers.length - 1}
            hasEditAccess={hasEditAccess}
            onClick={onCardClick}
            onEdit={onEditMember}
          />
        ))}
      </div>
    </div>
  );
}
