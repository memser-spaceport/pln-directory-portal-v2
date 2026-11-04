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
 * card still matches its patch of the map above it. The count and logo pile are the area's portfolio teams, so the card
 * says what's behind the door before you press it. The doors filter by the directory's own focus-area title.
 */
export function FocusAreaCards({ teams }: { teams: PortfolioTeam[] }) {
  const analytics = useHomeAnalytics();
  const cards = buildFocusAreaCards(teams);

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
              <span className={s.focusCount}>{a.count} portfolio teams</span>
            </div>
            <h3 className={s.focusName}>{a.name}</h3>
            <p className={s.focusLine}>{a.line}</p>
          </div>
          <div className={s.focusDoors}>
            <Link
              href={a.teamsHref}
              className={s.focusDoor}
              onClick={() => analytics.onFocusAreaClicked({ area: a.directoryTitle, target: 'teams' })}
            >
              Teams
              <ArrowRightIcon />
            </Link>
            <Link
              href={a.projectsHref}
              className={s.focusDoor}
              onClick={() => analytics.onFocusAreaClicked({ area: a.directoryTitle, target: 'projects' })}
            >
              Projects
              <ArrowRightIcon />
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
