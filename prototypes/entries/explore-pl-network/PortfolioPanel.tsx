'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { IslandsMap } from './IslandsMap';
import { ISLANDS, PORTFOLIO, type PortfolioLogo } from './islands';
import { TEAM_INFO } from './teamInfo';
import s from './ExplorePlNetwork.module.scss';

type View = 'islands' | 'list';

const VIEWS: { value: View; label: string }[] = [
  { value: 'islands', label: 'Map' },
  { value: 'list', label: 'List' },
];

// Collapsed, the list shows a few rows and a fade; Show all opens the rest.
const COLLAPSED_ROWS_PX = 360;

type Props = {
  onOpenProfile: (logo: PortfolioLogo) => string;
};

/**
 * The Editorial direction's portfolio: one black box (the islands' own sea)
 * holding the Islands / List switch at its top and whichever view is chosen,
 * so switching doesn't jump between a dark map and a light page list. The PL
 * cube view is the Visual direction's hero, not repeated here.
 */
export const PortfolioPanel = ({ onOpenProfile }: Props) => {
  const [view, setView] = useState<View>('islands');

  const header = (
    <div className={s.panelHeader}>
      <div className={s.panelSwitch} role="tablist" aria-label="Portfolio view">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={view === v.value}
            className={clsx(s.panelTab, { [s.panelTabOn]: view === v.value })}
            onClick={() => setView(v.value)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (view === 'islands') return <IslandsMap shape="islands" onOpenProfile={onOpenProfile} header={header} />;

  return (
    <div className={s.islandsRoot}>
      {header}
      <PortfolioList onOpenProfile={onOpenProfile} />
    </div>
  );
};

const PortfolioList = ({ onOpenProfile }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const groups = ISLANDS.map((i) => ({ ...i, logos: PORTFOLIO.filter((l) => l.island === i.id) }));

  return (
    <div className={s.darkListWrap}>
      <div
        className={clsx(s.darkList, { [s.darkListCollapsed]: !expanded })}
        style={{ '--collapsed': `${COLLAPSED_ROWS_PX}px` } as React.CSSProperties}
      >
        {groups.map((g) => (
          <section key={g.id} aria-label={g.name}>
            <h3 className={s.darkGroupTitle}>
              {g.isCentre ? 'Protocol Labs' : g.name} <span className={s.darkGroupCount}>{g.logos.length}</span>
            </h3>
            <div className={s.darkGrid}>
              {g.logos.map((l) => (
                <a key={l.id} className={s.darkItem} href={onOpenProfile(l)} target="_blank" rel="noopener noreferrer">
                  <span className={s.darkLogo} style={{ background: g.color }}>
                    <img src={l.logo} alt="" loading="lazy" />
                  </span>
                  {/* The directory's own name where matched; marketing's caps otherwise. */}
                  <span className={s.darkName}>{TEAM_INFO[l.id]?.displayName ?? l.name}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
      <button type="button" className={s.darkMore} onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        {expanded ? 'Show less' : `Show all ${PORTFOLIO.length} teams`}
      </button>
    </div>
  );
};
