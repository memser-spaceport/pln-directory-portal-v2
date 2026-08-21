'use client';

import React, { Fragment } from 'react';

import { ITeam } from '@/types/teams.types';

import { Divider } from '@/components/common/profile/Divider';

import { formatTeamSize } from './utils/formatTeamSize';
import { formatFoundedYear } from './utils/formatFoundedYear';

import { LocationIcon } from '../../icons';

import s from './TeamProfileMeta.module.scss';

interface Props {
  team: ITeam;
}

/**
 * The "Founded 2014 | 201–500 people | San Francisco, United States" line under the team name.
 * Every field is optional on the API, so only the ones a team actually filled in are rendered —
 * dividers included — and the whole row disappears when none of them are set.
 */
export const TeamProfileMeta = (props: Props) => {
  const { team } = props;

  const founded = formatFoundedYear(team?.dateFounded);
  const teamSize = formatTeamSize(team?.teamSize);
  const location = team?.location?.trim();

  const items = [
    founded && { key: 'founded', content: founded },
    teamSize && { key: 'teamSize', content: teamSize },
    location && {
      key: 'location',
      content: (
        <>
          <LocationIcon />
          <span>{location}</span>
        </>
      ),
    },
  ].filter(Boolean) as { key: string; content: React.ReactNode }[];

  if (!items.length) {
    return null;
  }

  return (
    <div className={s.root}>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 && <Divider />}
          <div className={s.item}>{item.content}</div>
        </Fragment>
      ))}
    </div>
  );
};
