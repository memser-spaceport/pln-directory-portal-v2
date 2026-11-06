'use client';

import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import {
  PL_CONTEXT,
  PL_ENTITIES,
  PL_FACTS,
} from '@/components/page/explore-pl-network/data/content';
import { PL_NETWORK_ORGANIZATIONS_LABEL } from '@/services/explore-pl-network/constants';
import { logoSrc } from '@/components/page/explore-pl-network/data/logoSrc';
import { ISLANDS } from '@/components/page/explore-pl-network/data/islands';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';

import ei from '@/components/page/explore-pl-network/EditorialIntro/EditorialIntro.module.scss';
// The team profile's follower facepile (20px rounds, 1.5px white ring, -7px overlap).
import tp from '../team-profile/TeamProfile.module.scss';
import fb from '../follow-shared/FollowButton.module.scss';
import { FOCUS_AREA_LINKS } from './mocks';
import local from './HomeV2Prototype.module.scss';

/** Marketing's About text up to "Organizations collaborate across…" (its first sentence). */
const INTRO_ABOUT = PL_CONTEXT.about.split(' Organizations collaborate')[0];

/**
 * Signed-out section 1, from the 2026-10-30 mock: EditorialIntro's header
 * (overline, title, mission lede, the two General Info paragraphs; production
 * classes and data/content.ts) set left-aligned beside a "Join the network"
 * card. The rest of EditorialIntro is split out below: the figures as their
 * own band (FactsBand), the entities as a row under the portfolio (EntitiesRow).
 *
 * The card's doors follow the mock, not the navbar pair: Sign up first and
 * filled ("Sign up for free"), an "or" rule, Sign in outlined. This page's
 * reader is mostly new (993 of 1,100 signed-out visitors have no account), so
 * Sign up leads; Sign in stays one press away for the 107 members. Paint is the
 * DS Button's (brand primary), not the mock's black.
 */
export function StoryIntro({
  onSignIn,
  onSignUp,
  faces,
  titleClassName,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
  /** Extra paint on the title (home-v2-b sets it in the PL gradient). */
  titleClassName?: string;
  /** Four faces for the pile under the doors: image URLs (home-v2 passes member avatars), or portfolio teams (home-v2-b). */
  faces: (string | PortfolioTeam)[];
}) {
  return (
    <section className={local.introGrid} aria-labelledby="home-intro-title">
      {/* 2026-11-02 design standup: shorter. No overline and no "The Protocol Labs
          Network" title: the mission is the H1 (it says what PL is, the old title only
          named it), a step smaller than the old title, then who the network is, cut
          before "Organizations collaborate across…". */}
      <header className={clsx(ei.edHeader, local.introHeader)}>
        <h1 id="home-intro-title" className={clsx(ei.edTitle, local.introTitle, titleClassName)}>
          {PL_CONTEXT.mission}
        </h1>
        <div className={clsx(ei.edBody, local.introBody)}>
          <p>{INTRO_ABOUT}</p>
        </div>
      </header>

      <JoinCard id="home-join-title" onSignIn={onSignIn} onSignUp={onSignUp} faces={faces} />
    </section>
  );
}

/**
 * The Join the network card: the hero's ask, and the page's closing CTA (the
 * same card, so the two can't drift). `id` labels each instance's heading.
 */
export function JoinCard({
  id,
  onSignIn,
  onSignUp,
  faces,
  className,
}: {
  id: string;
  onSignIn: () => void;
  onSignUp: () => void;
  faces: (string | PortfolioTeam)[];
  className?: string;
}) {
  return (
    <aside className={clsx(local.joinCard, className)} aria-labelledby={id}>
      <div className={local.joinHead}>
        <h2 id={id} className={local.joinTitle}>
          Join the network
        </h2>
        <p className={local.joinText}>Access the directory to find people, roles, deals, and what teams are shipping.</p>
      </div>
      {/* The product's glossy primary (follow-shared `.glossy`, the three-shadow
          highlight production hand-rolls on its headline presses) at size m. */}
      <Button size="m" style="fill" variant="primary" className={clsx(local.joinBtn, fb.glossy)} onClick={onSignUp}>
        Sign up for free
      </Button>
      <div className={local.joinOr} aria-hidden>
        or
      </div>
      <Button size="m" style="border" variant="neutral" className={local.joinBtn} onClick={onSignIn}>
        Sign in
      </Button>
      <p className={local.joinProof}>
        <span className={tp.subAvatars} aria-hidden>
          {faces.map((f) => (typeof f === 'string' ? f : logoSrc(f.logo))).map((src) => (
            <img key={src} className={clsx(tp.subAvatar, local.joinFace)} src={src} alt="" loading="lazy" />
          ))}
        </span>
        {PL_NETWORK_ORGANIZATIONS_LABEL} organizations in the network
      </p>
    </aside>
  );
}

/** The mock's shorter label for the one figure whose production label wraps in a quarter-width cell. */
const FACT_LABEL: Record<string, string> = { 'Organizations in the network': 'Network organizations' };

/** The figures as a full-bleed white band (the mock's second strip): EditorialIntro's PL_FACTS, left-aligned, hairline-divided. */
export function FactsBand({ portfolioCount }: { portfolioCount: number }) {
  return (
    <div className={local.factsBand}>
      <dl className={local.facts}>
        {PL_FACTS.map((f) => (
          <div key={f.label} className={local.fact}>
            <dd className={local.factValue}>{f.value === 'portfolio' ? portfolioCount : f.value}</dd>
            <dt className={ei.edFactLabel}>{FACT_LABEL[f.label] ?? f.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The PL entities as one row under the portfolio (2026-11-02 standup: the
 * portfolio and the entities read as one pair). The layout Explore's
 * EditorialIntro gives them (`.edEntities`, five across), as this page's cards.
 * The page supplies the section heading.
 */
export function EntitiesRow() {
  return (
    <ul className={local.entityGrid}>
      {PL_ENTITIES.map((e) => (
        <li key={e.name} className={local.entityItem}>
          <a className={local.entityCard} href={e.href} target="_blank" rel="noopener noreferrer">
            <span className={local.entityName}>{e.name}</span>
            <span className={local.entityLine}>{e.line}</span>
            <span className={local.entityDomain}>
              {e.domain}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M4 8l4-4M4.5 4H8v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const ISLAND_COLOR: Record<string, string> = Object.fromEntries(ISLANDS.map((i) => [i.id, i.color]));

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The four focus areas as cards, each with a Teams and a Projects door.
 * 2026-11-02 standup: keep them (about 1% of visitors use them, and nothing else
 * browses the directory by area yet). 2026-11-03: drawn as category cards
 * (Mobbin refs: Coda's community categories; Headspace / Dropbox topic tiles, a
 * count or "View all →" anchoring the foot). No colour band on top (removed
 * 2026-11-03); the island colour lives on the logo pile, so a card still matches
 * its patch of the map above it. The count and logo pile are the area's real portfolio teams, so the
 * card says what's behind the door before you press it. Used under the map
 * signed out and under the feed signed in, so both states browse the same way.
 */
export function FocusAreas({ teams }: { teams: PortfolioTeam[] }) {
  return (
    <ol className={local.focusAreas} aria-label="Browse the directory by focus area">
      {FOCUS_AREA_LINKS.map((a) => {
        const inArea = teams.filter((t) => t.island === a.id);
        return (
          <li
            key={a.id}
            className={local.focusCard}
            style={{ ['--focus-color' as string]: ISLAND_COLOR[a.id] ?? 'var(--foreground-brand-primary, #1b4dff)' }}
          >
            <div className={local.focusBody}>
              <div className={local.focusMeta}>
                <span className={tp.subAvatars} aria-hidden>
                  {inArea.slice(0, 4).map((t) => (
                    <img key={t.name} className={clsx(tp.subAvatar, local.focusLogo)} src={logoSrc(t.logo)} alt="" loading="lazy" />
                  ))}
                </span>
                <span className={local.focusCount}>{inArea.length} portfolio teams</span>
              </div>
              <h3 className={local.focusName}>{a.name}</h3>
              <p className={local.focusLine}>{a.line}</p>
            </div>
            <div className={local.focusDoors}>
              <a href={a.teamsHref} className={local.focusDoor}>
                Teams
                <ArrowRight />
              </a>
              <a href={a.projectsHref} className={local.focusDoor}>
                Projects
                <ArrowRight />
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
