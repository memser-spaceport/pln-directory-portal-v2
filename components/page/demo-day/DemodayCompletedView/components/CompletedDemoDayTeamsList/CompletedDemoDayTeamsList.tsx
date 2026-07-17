import clsx from 'clsx';
import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { DemoDayState } from '@/app/actions/demo-day.actions';

import { Button } from '@/components/common/Button';
import { PastTeamCard } from './components/PastTeamCard';

import s from './CompletedDemoDayTeamsList.module.scss';

const TEAMS_THRESHOLD = 6;

interface Props {
  demoDay?: DemoDayState;
  onCompletedViewShowMoreTeamsClicked: () => void;
}

export function CompletedDemoDayTeamsList(props: Props) {
  const { demoDay, onCompletedViewShowMoreTeamsClicked } = props;

  const [showAllTeams, toggleShowAllTeams] = useToggle(false);

  const displayTeams = demoDay?.teams;

  const handleShowMoreTeamsClick = () => {
    onCompletedViewShowMoreTeamsClicked();
    toggleShowAllTeams();
  };

  if (!displayTeams || isEmpty(displayTeams)) {
    return null;
  }

  const teamsNum = displayTeams.length;

  return (
    <section className={s.sectionTeams}>
      <div className={s.subtitle}>
        <h2 className={s.label}>Participating teams ({teamsNum})</h2>
        <p className={s.supportingText}>Innovative startups across AI, web3, crypto, robotics, and neurotech</p>
      </div>
      <div className={s.cards}>
        <div
          className={clsx(s.cardsGridContainer, {
            [s.expanded]: showAllTeams || teamsNum <= TEAMS_THRESHOLD,
          })}
        >
          <div className={s.cardsGrid}>
            {displayTeams.map((team) => (
              <PastTeamCard team={team} key={team.uid} />
            ))}
          </div>
          <div className={s.bottomShadow} />
        </div>
        {teamsNum > TEAMS_THRESHOLD && (
          <Button size="s" style="border" onClick={handleShowMoreTeamsClick}>
            Show {showAllTeams ? 'Less' : 'All'} Teams
          </Button>
        )}
      </div>
    </section>
  );
}
