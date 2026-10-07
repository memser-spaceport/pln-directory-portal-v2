import React from 'react';
import { PlCubeMark } from '@/components/common/PlCubeMark/PlCubeMark';
import { FOCUS_AREAS, PL_FACTS } from '@/components/page/explore-pl-network/data/content';
import { EXPLORE_PL_NETWORK_PATH } from '@/services/explore-pl-network/constants';
import { ArrowRightIcon } from '../icons';
import s from './SpvExploreTile.module.scss';

// The Explore landing's own figures; `portfolio` is a placeholder the landing
// fills from its map, so it has no value to show here.
const FACTS = PL_FACTS.filter((fact) => fact.value !== 'portfolio');

type Props = {
  onClick?: () => void;
};

/**
 * The page's one way to the Explore PL Network landing. The bigger tile from the
 * 2026-10-01 standup, shown to every viewer: a visitor who can't see the
 * Spotlight still needs somewhere to go, so it carries the network's key facts
 * and its four focus areas, not just a pitch for the click. The whole tile is
 * the link.
 */
export const SpvExploreTile = ({ onClick }: Props) => (
  <a className={s.root} href={EXPLORE_PL_NETWORK_PATH} target="_blank" rel="noopener noreferrer" onClick={onClick}>
    <div className={s.text}>
      <span className={s.overline}>While you are here</span>
      <span className={s.title}>Explore the PL Network</span>
      <span className={s.body}>
        Protocol Labs is an innovation network of startups, funds, labs and foundations building the frontiers of
        computing. See who is in it, and meet the teams behind the Spotlights.
      </span>
      <dl className={s.facts}>
        {FACTS.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      <ul className={s.areas}>
        {FOCUS_AREAS.map((area) => (
          <li key={area.id}>{area.name}</li>
        ))}
      </ul>
      <span className={s.cta}>
        Explore PL Network <ArrowRightIcon />
      </span>
    </div>
    <PlCubeMark className={s.art} />
  </a>
);
