'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { ISLANDS } from '../data/islands';
import type { PortfolioTeam } from '../data/portfolio';
import { directoryUrl, displayNameOf } from '../data/directoryUrl';
import { logoSrc } from '../data/logoSrc';
import { IslandsMap } from './IslandsMap';
import s from './PortfolioPanel.module.scss';

export type PortfolioView = 'map' | 'list';

const VIEWS: { value: PortfolioView; label: string }[] = [
  { value: 'map', label: 'Map' },
  { value: 'list', label: 'List' },
];

// Collapsed, the list shows a few rows and a fade; Show all opens the rest.
const COLLAPSED_HEIGHT_PX = 360;

type Props = {
  /** The merged teams, in fallback-file order (the map's MAP_STATES index them). */
  teams: PortfolioTeam[];
  onViewChanged?: (view: PortfolioView) => void;
  onTileOpened?: (logo: PortfolioTeam) => void;
  onProfileClicked?: (logo: PortfolioTeam, source: PortfolioView) => void;
  onShowAllToggled?: (expanded: boolean) => void;
};

/**
 * The portfolio: one black box (the islands' own sea) holding the Map / List
 * switch and whichever view is chosen, so switching doesn't jump between a
 * dark map and a light list.
 */
export const PortfolioPanel = ({ teams, onViewChanged, onTileOpened, onProfileClicked, onShowAllToggled }: Props) => {
  const [view, setView] = useState<PortfolioView>('map');

  const header = (
    <div className={s.panelHeader}>
      <div className={s.panelSwitch} role="group" aria-label="Portfolio view">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            className={clsx(s.panelTab, { [s.panelTabOn]: view === v.value })}
            onClick={() => {
              if (v.value === view) return;
              setView(v.value);
              onViewChanged?.(v.value);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (view === 'map') {
    return (
      <IslandsMap
        teams={teams}
        header={header}
        onTileOpened={onTileOpened}
        onProfileClicked={(logo) => onProfileClicked?.(logo, 'map')}
      />
    );
  }

  return (
    <div className={s.islandsRoot}>
      {header}
      <PortfolioList
        teams={teams}
        onProfileClicked={(logo) => onProfileClicked?.(logo, 'list')}
        onShowAllToggled={onShowAllToggled}
      />
    </div>
  );
};

const PortfolioList = ({
  teams,
  onProfileClicked,
  onShowAllToggled,
}: {
  teams: PortfolioTeam[];
  onProfileClicked: (logo: PortfolioTeam) => void;
  onShowAllToggled?: (expanded: boolean) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const groups = ISLANDS.map((i) => ({ ...i, logos: teams.filter((l) => l.island === i.id) }));

  return (
    <div className={s.darkListWrap}>
      <div
        id="explore-portfolio-list"
        className={clsx(s.darkList, { [s.darkListCollapsed]: !expanded })}
        style={{ '--collapsed': `${COLLAPSED_HEIGHT_PX}px` } as React.CSSProperties}
      >
        {groups.map((g) => (
          <section key={g.id} aria-label={g.isCentre ? 'Protocol Labs' : g.name}>
            <h3 className={s.darkGroupTitle}>
              {g.isCentre ? 'Protocol Labs' : g.name} <span className={s.darkGroupCount}>{g.logos.length}</span>
            </h3>
            <ul className={s.darkGrid}>
              {g.logos.map((l) => (
                <li key={l.id}>
                  <a
                    className={s.darkItem}
                    href={directoryUrl(l)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onProfileClicked(l)}
                  >
                    <span className={s.darkLogo} style={{ background: g.color }}>
                      <img src={logoSrc(l.logo)} alt="" loading="lazy" />
                    </span>
                    <span className={s.darkName}>{displayNameOf(l)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <button
        type="button"
        className={s.darkMore}
        aria-expanded={expanded}
        aria-controls="explore-portfolio-list"
        onClick={() => {
          setExpanded((e) => !e);
          onShowAllToggled?.(!expanded);
        }}
      >
        {expanded ? 'Show less' : `Show all ${teams.length} teams`}
      </button>
    </div>
  );
};
