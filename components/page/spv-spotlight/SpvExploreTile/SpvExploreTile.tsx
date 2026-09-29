import React from 'react';
import { PlCubeMark } from '@/components/common/PlCubeMark/PlCubeMark';
import { EXPLORE_PL_NETWORK_PATH, EXPLORE_PORTFOLIO_TEAM_COUNT } from '@/services/explore-pl-network/constants';
import { ArrowRightIcon } from '../icons';
import s from './SpvExploreTile.module.scss';

type Props = {
  onClick?: () => void;
};

/**
 * The page's one way to the Explore PL Network landing, for investors new to
 * the network. A tile under the team card rather than a hero button: it says
 * what the network is before asking for the click, and it doesn't compete with
 * the card's data-room action. The whole tile is the link.
 */
export const SpvExploreTile = ({ onClick }: Props) => (
  <a className={s.root} href={EXPLORE_PL_NETWORK_PATH} target="_blank" rel="noopener noreferrer" onClick={onClick}>
    <div className={s.text}>
      <span className={s.overline}>New to Protocol Labs?</span>
      <span className={s.title}>Explore the PL Network</span>
      <span className={s.body}>
        {EXPLORE_PORTFOLIO_TEAM_COUNT} teams across AI, neurotech, digital rights and new economies: the network this
        SPV comes from, and the founders, funds and labs behind it.
      </span>
      <span className={s.cta}>
        Explore PL Network <ArrowRightIcon />
      </span>
    </div>
    <PlCubeMark className={s.art} />
  </a>
);
