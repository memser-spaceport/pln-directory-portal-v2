'use client';

import clsx from 'clsx';
import Link from 'next/link';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { logoSrc } from '@/components/page/explore-pl-network/data/logoSrc';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';

import { ArrowRightIcon } from './icons';
import { buildFocusAreaCards } from './utils/focusAreaCards';
import s from './HomeV2.module.scss';

/**
 * The four focus areas as category cards, each with a Teams and a Projects door (prototype `FocusAreas`,
 * home-v2/StoryIntro.tsx). No colour band on top (removed 2026-11-03); the island colour lives on the logo pile, so a
 * card still matches its patch of the map above it. The logo pile is the area's portfolio teams; the count is what the
 * Teams door lists (LAB-3162), so the card says what's behind the door before you press it. The doors filter by the
 * directory's own focus-area title.
 */
export function FocusAreaCards({
  teams,
  projectCounts,
  teamCounts,
}: {
  teams: PortfolioTeam[];
  /** Projects per directory title; an area with none gets no Projects door (the Teams door then spans the foot). */
  projectCounts?: Record<string, number> | null;
  /** Teams per directory title, as the Teams door lists them; without it the cards show no number. */
  teamCounts?: Record<string, number> | null;
}) {
  const analytics = useHomeAnalytics();
  const cards = buildFocusAreaCards(teams, projectCounts, teamCounts);

  return (
    <ol className={s.focusAreas} aria-label="Browse the directory by focus area">
      {cards.map((a) => (
        <li key={a.id} className={s.focusCard} style={{ ['--focus-color' as string]: a.color }}>
          <div className={s.focusBody}>
            <div className={s.focusMeta}>
              <span className={s.subAvatars} aria-hidden>
                {a.logos.map((t) => (
                  <img
                    key={t.name}
                    className={clsx(s.subAvatar, s.focusLogo)}
                    src={logoSrc(t.logo)}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </span>
              {a.count !== null && (
                <span className={s.focusCount}>
                  {a.count} {a.count === 1 ? 'team' : 'teams'}
                </span>
              )}
            </div>
            <h3 className={s.focusName}>{a.name}</h3>
            <p className={s.focusLine}>{a.line}</p>
          </div>
          <div className={clsx(s.focusDoors, !a.projectsHref && s.focusDoorsSingle)}>
            <Link
              href={a.teamsHref}
              className={s.focusDoor}
              onClick={() => analytics.onFocusAreaClicked({ area: a.directoryTitle, target: 'teams' })}
            >
              Teams
              <ArrowRightIcon />
            </Link>
            {a.projectsHref && (
              <Link
                href={a.projectsHref}
                className={s.focusDoor}
                onClick={() => analytics.onFocusAreaClicked({ area: a.directoryTitle, target: 'projects' })}
              >
                Projects
                <ArrowRightIcon />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
