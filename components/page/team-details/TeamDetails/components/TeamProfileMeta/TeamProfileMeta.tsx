'use client';

import React, { Fragment, ReactNode } from 'react';
import { clsx } from 'clsx';

import { ITeam } from '@/types/teams.types';

import { Divider } from '@/components/common/profile/Divider';
import { TagsOverflow } from '@/components/common/profile/TagsOverflow';

import { formatTeamSize } from './utils/formatTeamSize';
import { formatFoundedYear } from './utils/formatFoundedYear';

import { LocationIcon } from '../../icons';

import s from './TeamProfileMeta.module.scss';

interface Props {
  team: ITeam;
}

const LOCATIONS_TO_SHOW = 3;

/**
 * The "Founded 2014 | 201–500 people | San Francisco, United States" line under the team name.
 * Every field is optional on the API, so only the ones a team actually filled in are rendered —
 * dividers included — and the whole row disappears when none of them are set.
 */
export const TeamProfileMeta = (props: Props) => {
  const { team } = props;

  const founded = formatFoundedYear(team?.dateFounded);
  const teamSize = formatTeamSize(team?.teamSize);
  const locations = team?.locations ?? [];

  const items = [
    founded && { key: 'founded', content: founded },
    teamSize && { key: 'teamSize', content: teamSize },
    locations.length > 0 && {
      key: 'location',
      content: (
        <>
          <LocationIcon className={s.icon} />
          {locations.slice(0, LOCATIONS_TO_SHOW).reduce((acc: ReactNode[], location, index, all) => {
            acc.push(<span key={`${index}-value`}>{location}</span>);

            if (all.length - 1 !== index) {
              acc.push(
                <span className={s.divider} key={`${index}-separator`}>
                  ·
                </span>,
              );
            }

            return acc;
          }, [])}
          {locations.length > LOCATIONS_TO_SHOW && (
            <TagsOverflow
              titles={locations.slice(LOCATIONS_TO_SHOW)}
              classes={{
                trigger: s.overflowTrigger,
              }}
            />
          )}
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
          <div className={clsx(s.item, item.key === 'location' && s.location)}>{item.content}</div>
        </Fragment>
      ))}
    </div>
  );
};
