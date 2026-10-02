'use client';

import React from 'react';
import clsx from 'clsx';
import { useToggle } from 'react-use';
import { Button } from '@/components/common/Button';
import { LOGOS } from '@/components/common/LogosGrid/constants';
// LogosGrid's own stylesheet and logo list. The component is copy-simplified
// only because its header is hard-coded to "past demo days" and it fires
// Demo Day analytics on Show All.
import g from '@/components/common/LogosGrid/LogosGrid.module.scss';

export const SpvLogos = () => {
  const [showAll, toggleShowAll] = useToggle(false);

  return (
    <div className={g.root}>
      <div className={g.header}>PL Network teams have raised from top VCs and angel investors</div>

      <div className={clsx(g.gridContainer, { [g.expanded]: showAll })}>
        <div className={g.grid}>
          {LOGOS.map((icon) => (
            <div key={icon} className={g.cell}>
              <img
                src={icon}
                className={g.logo}
                alt={icon.replace('/icons/demoday/landing/logos/', '').replace('.svg', '')}
              />
            </div>
          ))}
        </div>
        <div className={g.bottomShadow} />
      </div>

      <Button size="s" style="border" className={g.btn} onClick={toggleShowAll}>
        Show {showAll ? 'Less' : 'All'}
      </Button>
    </div>
  );
};
