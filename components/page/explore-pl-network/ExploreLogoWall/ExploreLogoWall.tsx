'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/common/Button';
import { LOGOS } from '@/components/common/LogosGrid/constants';
import s from './ExploreLogoWall.module.scss';

type Props = {
  onShowAllToggled?: (expanded: boolean) => void;
};

const logoName = (path: string) => path.replace('/icons/demoday/landing/logos/', '').replace('.svg', '');

/**
 * "Raised from top VCs": Demo Day's logo wall (LogosGrid) with its own header.
 * LogosGrid itself is hard-coded to "past demo days" and fires Demo Day
 * analytics on Show All, so only its logo list is shared.
 */
export const ExploreLogoWall = ({ onShowAllToggled }: Props) => {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className={s.root}>
      <h2 className={s.header}>PL Network teams have raised from top VCs and angel investors</h2>

      <div className={clsx(s.gridContainer, { [s.expanded]: showAll })}>
        <ul className={s.grid}>
          {LOGOS.map((icon) => (
            <li key={icon} className={s.cell}>
              <img src={icon} className={s.logo} alt={logoName(icon)} loading="lazy" />
            </li>
          ))}
        </ul>
        <div className={s.bottomShadow} aria-hidden />
      </div>

      <Button
        size="s"
        style="border"
        className={s.btn}
        aria-expanded={showAll}
        onClick={() => {
          setShowAll((v) => !v);
          onShowAllToggled?.(!showAll);
        }}
      >
        Show {showAll ? 'Less' : 'All'}
      </Button>
    </div>
  );
};
