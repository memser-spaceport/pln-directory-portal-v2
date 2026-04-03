import { ChangeEvent, Fragment, useEffect, useState } from 'react';

import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import { SearchIcon } from './icons';
import { TeamMemberCard } from '../TeamMemberCard';

import s from './AllMembers.module.scss';

interface Props {
  members: IMember[];
  teamId: string;
  onCardClick: (member: IMember) => void;
}

export function AllMembers(props: Props) {
  const { teamId, members = [], onCardClick } = props;

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
        {allMembers?.map((member: IMember, index: number) => {
          const team = member?.teams?.find((team: ITeam) => team.id === teamId);
          return (
            <Fragment key={`${member} + ${index}`}>
              <div className={index < allMembers?.length ? s.memberBorder : undefined}>
                <TeamMemberCard
                  onCardClick={onCardClick}
                  url={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
                  member={member}
                  team={team}
                />
              </div>
            </Fragment>
          );
        })}
        {allMembers.length === 0 && (
          <div className={s.emptyResult}>
            <p>No Members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
