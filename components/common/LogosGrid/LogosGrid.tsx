import clsx from 'clsx';
import { useMemo } from 'react';
import shuffle from 'lodash/shuffle';
import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';

import TEAMS from './teams.json';

import { TeamCard } from './components/TeamCard';

import s from './LogosGrid.module.scss';

interface Props {
  className?: string;
}

export function LogosGrid(props: Props) {
  const { className } = props;

  const [showAll, toggleShowAll] = useToggle(false);

  const teams = useMemo(() => shuffle(TEAMS), [])

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>Teams featured in this Demo Day</div>

      <div
        className={clsx(s.gridContainer, {
          [s.expanded]: showAll,
        })}
      >
        <div className={s.grid}>
          {teams.map((team) => (
            <TeamCard key={team.name} team={team} />
          ))}
        </div>
      </div>

      <Button style="border" className={s.btn} onClick={toggleShowAll}>
        {showAll ? 'Hide' : 'Show'} All Teams
      </Button>
    </div>
  );
}
