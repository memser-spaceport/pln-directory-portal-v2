'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { AppLogo } from '@/components/core/navbar/components/icons';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';
import { ISLANDS } from '@/components/page/explore-pl-network/data/islands';
import {
  EDITORIAL_HEADER,
  EXPLORE_SUPPORT_EMAIL,
  PL_CONTEXT,
  PL_ENTITIES,
  PL_FACTS,
} from '@/components/page/explore-pl-network/data/content';
import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';

import {
  FOCUS_AREA_LINKS,
  FOUNDER_FACES,
  NEWS_PREVIEW,
  PORTFOLIO_TEAMS,
  ROLES,
  TOTAL_OPEN_ROLES,
} from '../home-v2/mocks';
import v2 from '../home-v2/HomeV2Prototype.module.scss';

import { grotesk, mono } from './zaroFonts';
import z from './Zaro.module.scss';

const ISLAND_COLOR = Object.fromEntries(ISLANDS.map((i) => [i.id, i.color]));
const PORTFOLIO_COUNT = PORTFOLIO_TEAMS.length;
const ORIGIN_PROJECTS = ['IPFS', 'Filecoin', 'libp2p'];

const Arrow = () => (
  <svg className={z.arrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
  </svg>
);

const OutArrow = () => (
  <svg className={z.arrow} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="square" />
  </svg>
);

/**
 * The top bar in the reference's grammar: a white, hairline-framed bar inset from the page edge, the
 * product's destinations beside the logo, then Sign in as text and Sign up as the one dark press.
 * Signed out only; the member page keeps B's sidebar.
 */
export function ZaroNavBar({ onSignUp, onSignIn }: { onSignUp: () => void; onSignIn: () => void }) {
  return (
    <div className={clsx(z.navWrap, grotesk.variable, mono.variable)}>
      <nav className={z.nav} aria-label="Main">
        <Link href="/prototypes/home-v2-style-refresh-2" className={z.navLogo} aria-label="Protocol Labs Directory home">
          <AppLogo />
          <span className={z.navWordmark}>Protocol Labs</span>
        </Link>
        <div className={z.navLinks}>
          <Link href="/members">Members</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/jobs">Job Board</Link>
          <Link href="/events/irl">Events</Link>
          <Link href="/forum">Forum</Link>
        </div>
        <div className={z.navActions}>
          <button type="button" className={z.navSignIn} onClick={onSignIn}>
            Sign in
          </button>
          <button type="button" className={clsx(z.btn, z.btnBrand, z.btnSmall)} onClick={onSignUp}>
            Sign up <Arrow />
          </button>
        </div>
      </nav>
    </div>
  );
}

/** Production's AppLogo path (components/core/navbar/components/icons.tsx), copied: the component bakes in a
    fill and a 48px size, and the hero needs the bare outline. */
const PL_LOGO_PATH =
  'M39.9824 13.8291C40.161 13.7268 40.3906 13.8548 40.3906 14.085V31.6504C40.3906 31.8548 40.2888 32.0335 40.1104 32.1357L24.9072 40.8291C24.7288 40.9569 24.4993 40.804 24.499 40.5996V33.0566C24.499 32.8521 24.6007 32.6726 24.7793 32.5703L32.917 27.8916C33.0954 27.7893 33.1972 27.6106 33.1973 27.4062L33.1719 18.0225C33.1974 17.8179 33.3 17.6394 33.4785 17.5371L39.9824 13.8291ZM15.749 28.9912C15.749 28.7613 15.9787 28.6334 16.1572 28.7607L22.7393 32.5449C22.9177 32.6472 23.0195 32.8268 23.0195 33.0312V40.5996C23.0192 40.8039 22.7898 40.9313 22.6113 40.8291L16.0303 37.0449C15.8517 36.9427 15.7491 36.7641 15.749 36.5596V28.9912ZM7 13.9062C7 13.7017 7.25515 13.5479 7.4082 13.6758L22.7393 22.4199C22.9177 22.5733 23.0449 22.7526 23.0449 22.957L23.0195 30.6279C23.0193 30.8066 22.8404 30.8577 22.7129 30.8066L14.6777 26.2041C14.4992 26.1022 14.2695 26.2302 14.2695 26.4346V35.5107C14.2695 35.7152 14.0154 35.8687 13.8623 35.7412L7.28027 32.0078C7.10199 31.9055 7 31.7268 7 31.5225V13.9062ZM31.2842 18.8154C31.4627 18.6876 31.6922 18.8405 31.6924 19.0449V26.7158C31.6923 26.818 31.6409 26.9198 31.5645 26.9453L24.9072 30.7559C24.7287 30.8835 24.4991 30.7299 24.499 30.5254V22.9824C24.4991 22.7781 24.601 22.5992 24.7793 22.5225L31.2842 18.8154ZM14.7295 8.07617C14.9078 7.99967 15.1116 7.99967 15.3154 8.07617L30.6465 16.8203C30.825 16.9226 30.825 17.2044 30.6465 17.3066L24.1416 21.0391C23.9631 21.1413 23.7596 21.1413 23.5811 21.0391L8.25 12.2949C8.09701 12.1926 8.09702 11.9119 8.25 11.8096L14.7295 8.07617ZM32.2021 8.07617C32.3807 7.97393 32.5851 7.97399 32.7637 8.07617L39.3701 11.8603C39.5487 11.9626 39.5487 12.2444 39.3701 12.3467L32.8145 16.0791C32.636 16.1812 32.4324 16.1812 32.2539 16.0791L25.6465 12.2949C25.4684 12.1925 25.4684 11.912 25.6465 11.8096L32.2021 8.07617Z';

/* The cube the logo contour draws, in the drawing's units: side walls at x 50 / 470, the side edges'
   top and bottom corners at y 124 / 346, the floor's front corner at y 464. Its isometric angle is the
   mark's own: 118 down per 210 across (≈ 29.3°). */
const CUBE_X = 260;
const CUBE_HW = 210;
const CUBE_HH = 118;
const WALL_TOP = 124;
const FLOOR_Y = 346;

/* The planes fill the cube: each is its full horizontal section (24 in from the walls, so the walls read
   as a box around the stack with air between, not as the planes' own edges), the bottom one's slab rests on the floor, and the top one sits as high as the logo's
   silhouette allows (its back corner meets the contour's top, y ≈ 50). The rest is spread evenly. */
const HALF_W = CUBE_HW - 24;
const SLAB = 12;
const LAST_Y = FLOOR_Y - SLAB;
const FIRST_Y = 176;
const LAYER_GAP = (LAST_Y - FIRST_Y) / 3;
const HALF_H = Math.round(HALF_W * (CUBE_HH / CUBE_HW));

/** The cube's horizontal section at height y. */
const ring = (y: number) =>
  `M${CUBE_X - CUBE_HW} ${y} ${CUBE_X} ${y + CUBE_HH} ${CUBE_X + CUBE_HW} ${y} ${CUBE_X} ${y - CUBE_HH}Z`;

/* The build loop, in seconds: each plane drops from above and lands on the one below (bottom first), the
   stack holds, then lifts away top first and builds again. */
const LOOP = 10;
const FIRST_DROP = 0.4;
const DROP_STEP = 0.6;
const DROP = 0.8;
const LIFT_AT = 7.6;
const LIFT_STEP = 0.15;
const LIFT = 0.6;
const DROP_FROM = -150;

const pct = (s: number) => `${((s / LOOP) * 100).toFixed(2)}%`;

/**
 * One keyframe set per plane, generated so every plane shares the loop but lands at its own moment. Planes
 * are numbered top (0) to bottom; the bottom one lands first. Each landing lights the plane's edge in
 * lavender and brings its legend line up to full ink.
 */
function stackKeyframes(count: number) {
  let css = '';
  for (let i = 0; i < count; i++) {
    const order = count - 1 - i;
    const start = FIRST_DROP + order * DROP_STEP;
    const land = start + DROP;
    const lift = LIFT_AT + i * LIFT_STEP;
    const gone = lift + LIFT;
    css += `
@keyframes zStackDrop${i} {
  0%, ${pct(start)} { opacity: 0; transform: translateY(${DROP_FROM}px); animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
  ${pct(start + DROP * 0.35)} { opacity: 1; }
  ${pct(land)}, ${pct(lift)} { opacity: 1; transform: translateY(0); animation-timing-function: cubic-bezier(0.55, 0, 0.75, 0.2); }
  ${pct(gone)}, 100% { opacity: 0; transform: translateY(-36px); }
}
@keyframes zStackFlash${i} {
  0%, ${pct(land - 0.05)} { opacity: 0; }
  ${pct(land + 0.15)} { opacity: 0.95; }
  ${pct(land + 1.1)}, 100% { opacity: 0; }
}
@keyframes zStackLegend${i} {
  0%, ${pct(land - 0.1)} { opacity: 0.35; }
  ${pct(land + 0.2)}, ${pct(lift)} { opacity: 1; }
  ${pct(gone)}, 100% { opacity: 0.35; }
}
[data-z-layer="${i}"] { animation: zStackDrop${i} ${LOOP}s linear infinite both; }
[data-z-flash="${i}"] { animation: zStackFlash${i} ${LOOP}s linear infinite both; }
[data-z-legend="${i}"] { animation: zStackLegend${i} ${LOOP}s linear infinite both; }`;
  }
  css += `
@media (prefers-reduced-motion: reduce) {
  [data-z-layer], [data-z-flash], [data-z-legend] { animation: none; }
  [data-z-flash] { opacity: 0; }
}`;
  return css;
}

/**
 * Four focus areas as four planes in an isometric stack, each a dot field in its island colour (the
 * reference's hero drawing), animated as a build: the frame draws itself once, then the planes drop in and
 * stack one onto another, hold, lift away and stack again. CSS only; prefers-reduced-motion gets the still,
 * finished stack.
 */
function NetworkStack() {
  const layers = FOCUS_AREA_LINKS.map((a) => ({ name: a.name, color: ISLAND_COLOR[a.id] ?? '#8f827a' }));
  return (
    <div className={z.stack} aria-hidden>
      <style>{stackKeyframes(layers.length)}</style>
      <svg viewBox="0 0 520 520" className={z.stackSvg}>
        <defs>
          {layers.map((l, i) => (
            <pattern key={l.name} id={`z-dots-${i}`} width="14" height="8" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="4" r="1.6" fill={l.color} />
            </pattern>
          ))}
        </defs>
        {/* The Protocol Labs mark as a contour behind the stack: the navbar AppLogo's path (48-unit box),
            scaled ×12.6 and centred on the drawing; the stroke stays 1px at any scale. */}
        <path
          className={z.stackFrame}
          pathLength={1}
          transform="translate(-38.6 -51.1) scale(12.6)"
          d={PL_LOGO_PATH}
          fill="none"
          stroke="#b8b0f6"
          strokeWidth="1"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* The cube's walls in line: the floor, the vertical edges (back one dashed, it is behind);
            the planes themselves are the floors. */}
        <g className={z.stackWalls} fill="none" stroke="#b8b0f6" strokeWidth="1">
          <path d={ring(FLOOR_Y)} />
          <path d={`M${CUBE_X - CUBE_HW} ${WALL_TOP}V${FLOOR_Y}M${CUBE_X + CUBE_HW} ${WALL_TOP}V${FLOOR_Y}`} />
          <path d={`M${CUBE_X} ${FLOOR_Y - CUBE_HH}V${WALL_TOP - CUBE_HH + 40}`} strokeDasharray="3 5" />
          <path d={`M${CUBE_X} ${FLOOR_Y + CUBE_HH}V${WALL_TOP + CUBE_HH}`} />
        </g>
        {/* Painted bottom plane first, so each higher plane covers the one beneath it (SVG has no z-index:
            later paints on top). The indices stay top-to-bottom for the keyframes. */}
        {layers
          .map((l, i) => {
            const y = FIRST_Y + i * LAYER_GAP;
            const plane = `M260 ${y - HALF_H} ${260 + HALF_W} ${y} 260 ${y + HALF_H} ${260 - HALF_W} ${y}Z`;
            return (
              <g key={l.name} data-z-layer={i}>
                <path
                  d={`M${260 - HALF_W} ${y}v${SLAB}l${HALF_W} ${HALF_H} ${HALF_W}-${HALF_H}v-${SLAB}`}
                  fill="#f9f9f7"
                  stroke="#8f827a"
                  strokeWidth="0.8"
                />
                <path d={plane} fill="#f9f9f7" stroke="#8f827a" strokeWidth="0.8" />
                <path d={plane} fill={`url(#z-dots-${i})`} opacity="0.85" />
                <path data-z-flash={i} d={plane} fill="none" stroke="#6b5fd6" strokeWidth="1.6" />
              </g>
            );
          })
          .reverse()}
      </svg>
      <ul className={z.stackLegend}>
        {layers.map((l, i) => (
          <li key={l.name} data-z-legend={i}>
            <span className={z.legendSwatch} style={{ background: l.color }} />
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * home-v2's signed-out story, redrawn in zaro.ai's visual language: warm paper ground, near-black
 * brown ink, very large tight headlines whose second sentence goes grey, square buttons, hairline
 * frames and dashed boxes, uppercase mono labels, a lavender accent, a dark closing band and footer.
 * Same content and order as home-v2 (who PL is, the figures, this week, focus areas, the portfolio,
 * open roles, entities, backers, the Join ask), same mocks.
 */
export function ZaroSignedOut({
  storyFor,
  allHref,
  onOpenStory,
  onSignUp,
  onSignIn,
}: {
  storyFor: (uid: string) => ITeamNewsItem;
  allHref: string;
  onOpenStory: (story: ITeamNewsItem) => void;
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const stories = [NEWS_PREVIEW.lead, ...NEWS_PREVIEW.also].map((i) => storyFor(i.uid));

  return (
    <div className={clsx(z.page, grotesk.variable, mono.variable, aileron.variable)}>
      {/* 1. Who PL is. */}
      <section className={z.hero} aria-labelledby="z-hero-title">
        <div className={z.heroCopy}>
          <p className={z.overline}>{EDITORIAL_HEADER.overline}</p>
          <h1 id="z-hero-title" className={z.heroTitle}>
            {EDITORIAL_HEADER.title}.
          </h1>
          <p className={z.heroLede}>{PL_CONTEXT.mission}</p>
          <div className={z.heroActions}>
            <button type="button" className={clsx(z.btn, z.btnBrand)} onClick={onSignUp}>
              Sign up for free <Arrow />
            </button>
            <button type="button" className={clsx(z.btn, z.btnOutline)} onClick={onSignIn}>
              Sign in
            </button>
          </div>
          <div className={z.faces}>
            <span className={z.facePile}>
              {FOUNDER_FACES.map((f) => (
                <img key={f.uid} src={f.image} alt={f.name} title={f.name} />
              ))}
            </span>
            <span className={z.monoNote}>750+ organizations in the network</span>
          </div>
        </div>
        <NetworkStack />
      </section>

      {/* The figures, beside the projects PL started as. */}
      <section className={z.strip} aria-label="Protocol Labs at a glance">
        <div className={z.stripCell}>
          <p className={z.overline}>Started as the team behind</p>
          <div className={z.boxRow}>
            {ORIGIN_PROJECTS.map((p) => (
              <span key={p} className={z.dashedBox}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className={clsx(z.stripCell, z.stripFacts)}>
          <p className={z.overline}>By the numbers</p>
          <dl className={z.facts}>
            {PL_FACTS.map((f) => (
              <div key={f.label} className={z.fact}>
                <dt>{f.label}</dt>
                <dd>{f.value === 'portfolio' ? PORTFOLIO_COUNT : f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. Focus areas as numbered cards, each a door into the directory. */}
      <section className={z.section} aria-labelledby="z-focus-title">
        <h2 id="z-focus-title" className={z.twoTone}>
          <span>One network, 750+ organizations.</span> <span>Four frontiers of computing.</span>
        </h2>
        <p className={z.sectionLede}>{PL_CONTEXT.about}</p>
        <div className={z.cards}>
          {FOCUS_AREA_LINKS.map((a, i) => (
            <article key={a.id} className={z.card}>
              <div className={z.cardArt} style={{ ['--z-area' as string]: ISLAND_COLOR[a.id] }}>
                <span className={z.cardNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={z.cardTitle}>{a.name}.</h3>
              </div>
              <div className={z.cardBody}>
                <p>{a.line}</p>
                <span className={z.chips}>
                  <a href={a.teamsHref} className={z.chip}>
                    Teams <Arrow />
                  </a>
                  <a href={a.projectsHref} className={z.chip}>
                    Projects <Arrow />
                  </a>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. This week beside open roles: the reference's two-panel comparison frame. */}
      <section className={z.section} aria-labelledby="z-week-title">
        <h2 id="z-week-title" className={z.twoTone}>
          <span>The network moves every week.</span> <span>Here is what happened.</span>
        </h2>
        <div className={z.split}>
          <div className={z.panel}>
            <span className={z.tags}>
              <span className={z.tag}>News</span>
              <span className={clsx(z.tag, z.tagLive)}>
                <i /> This week
              </span>
            </span>
            <h3 className={z.panelTitle}>This week in the network.</h3>
            <p className={z.panelSub}>Launches, funding and announcements from network teams.</p>
            <ul className={z.rows}>
              {stories.map((s) => (
                <li key={s.uid}>
                  <button type="button" className={z.row} onClick={() => onOpenStory(s)}>
                    <span className={z.rowMain}>
                      <span className={z.rowMeta}>
                        {s.teamName} · {EVENT_TYPE_LABEL[s.eventType]}
                      </span>
                      <span className={z.rowTitle}>{s.title}</span>
                    </span>
                    <span className={z.rowTime}>{formatTimeAgo(s.eventDate)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <a href={allHref} className={z.textLink}>
              See all updates <Arrow />
            </a>
          </div>
          <div className={clsx(z.panel, z.panelLav)}>
            <span className={z.tags}>
              <span className={z.tag}>Job Board</span>
              <span className={clsx(z.tag, z.tagLive)}>
                <i /> {TOTAL_OPEN_ROLES} open
              </span>
            </span>
            <h3 className={z.panelTitle}>Work with a network team.</h3>
            <p className={z.panelSub}>Anyone can browse. A profile lets you apply.</p>
            <ul className={z.rows}>
              {ROLES.map((r) => (
                <li key={`${r.teamUid}-${r.title}`}>
                  <a href={r.applyUrl} target="_blank" rel="noreferrer" className={z.row}>
                    <span className={z.rowMain}>
                      <span className={z.rowMeta}>{r.teamName}</span>
                      <span className={z.rowTitle}>{r.title}</span>
                    </span>
                    <span className={z.rowTime}>{r.location}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={z.panelNote}>
              <button type="button" className={z.inlineLink} onClick={onSignUp}>
                Sign up
              </button>{' '}
              to apply with your directory profile.{' '}
              <Link href="/jobs" className={z.textLink}>
                See all {TOTAL_OPEN_ROLES} jobs <Arrow />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 4. The portfolio, framed. */}
      <section className={z.section} aria-labelledby="z-portfolio-title">
        <h2 id="z-portfolio-title" className={z.twoTone}>
          <span>The portfolio.</span> <span>{PORTFOLIO_COUNT} teams, with Protocol Labs at the centre.</span>
        </h2>
        <div className={z.frame}>
          <div className={clsx(v2.mapClamp, mapOpen && v2.mapClampOpen)}>
            <PortfolioPanel teams={PORTFOLIO_TEAMS} />
            {!mapOpen && (
              <button type="button" className={v2.mapMore} onClick={() => setMapOpen(true)}>
                Show the whole map
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 5. The PL entities, as a hairline grid. */}
      <section className={z.section} aria-labelledby="z-entities-title">
        <h2 id="z-entities-title" className={z.twoTone}>
          <span>Five organizations.</span> <span>One mission.</span>
        </h2>
        <div className={z.entities}>
          {PL_ENTITIES.map((e, i) => (
            <a key={e.name} href={e.href} target="_blank" rel="noreferrer" className={z.entity}>
              <span className={z.cardNumPlain}>{String(i + 1).padStart(2, '0')}</span>
              <span className={z.entityName}>{e.name}</span>
              <span className={z.entityLine}>{e.line}</span>
              <span className={z.entityDomain}>
                {e.domain} <OutArrow />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 6. Who has backed the network (the wall carries its own centred title). */}
      <section className={clsx(z.section, z.backers)} aria-label="Backed by">
        <ExploreLogoWall />
      </section>

      {/* 7. The closing ask, on the reference's dark band. */}
      <section className={z.dark} aria-labelledby="z-join-title">
        <div className={z.darkInner}>
          <h2 id="z-join-title" className={z.darkTitle}>
            <span>Join the network.</span> <span>Find your people at the frontier.</span>
          </h2>
          <p className={z.darkLede}>
            The directory is how 750+ organizations find each other: members, teams, projects, roles and events.
          </p>
          <div className={z.heroActions}>
            <button type="button" className={clsx(z.btn, z.btnOnBlue)} onClick={onSignUp}>
              Sign up for free <Arrow />
            </button>
            <button type="button" className={clsx(z.btn, z.btnGhostOnBlue)} onClick={onSignIn}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className={z.footer}>
        <div className={z.footCols}>
          <div>
            <p className={z.footHead}>Directory</p>
            <Link href="/members">Members</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/projects">Projects</Link>
          </div>
          <div>
            <p className={z.footHead}>Network</p>
            <Link href="/jobs">Job Board</Link>
            <Link href="/events/irl">Events</Link>
            <Link href="/forum">Forum</Link>
          </div>
          <div>
            <p className={z.footHead}>Protocol Labs</p>
            {PL_ENTITIES.slice(0, 4).map((e) => (
              <a key={e.name} href={e.href} target="_blank" rel="noreferrer">
                {e.name}
              </a>
            ))}
          </div>
          <div>
            <p className={z.footHead}>Contact</p>
            <a href={`mailto:${EXPLORE_SUPPORT_EMAIL}`}>{EXPLORE_SUPPORT_EMAIL}</a>
            <button type="button" onClick={onSignIn}>
              Sign in
            </button>
          </div>
        </div>
        <p className={z.footMark} aria-hidden>
          Protocol Labs
        </p>
        <div className={z.footBottom}>
          <span>© {new Date().getFullYear()} Protocol Labs. Team information is provided by the teams.</span>
          <span className={z.footLegal}>
            <a href="https://protocol.ai/legal/privacy-policy/">Privacy policy</a>
            <a href="https://protocol.ai/legal/">Terms and conditions</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
