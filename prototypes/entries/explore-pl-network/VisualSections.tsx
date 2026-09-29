'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { IslandsMap } from './IslandsMap';
import { ISLANDS, PORTFOLIO, type IslandId } from './islands';
import { DIRECTION_COPY, FOCUS_AREAS, PL_CONTEXT, PL_ENTITIES, PL_VIDEO } from './mocks';
import s from './ExplorePlNetwork.module.scss';
import vh from './VisualHero.module.scss';

/**
 * Direction B — Visual (2026-09-29 sync: "more visual/video, but still needs
 * Protocol Labs context"). Leads with the logo cube on marketing's black sea,
 * full width, with a slow shimmer running through the tiles; then General
 * Info as a readable block beside a real PL talk, and the entities as a light
 * row of links. There is no portfolio section below: the hero IS the
 * portfolio (2026-09-29), so it says so — the lede names the action and a
 * pulsing hint sits over the map until the first click.
 */

type Props = { onOpenProfile: Parameters<typeof IslandsMap>[0]['onOpenProfile'] };

export const VisualHero = ({ onOpenProfile }: Props) => {
  const copy = DIRECTION_COPY.visual;
  const [used, setUsed] = useState(false);

  return (
    <section className={s.vHero}>
      <div className={s.vHeroText}>
        <span className={s.vHeroOverline}>{copy.overline}</span>
        <h1 className={s.vHeroTitle}>{copy.title}</h1>
        <p className={s.vHeroBody}>{copy.body(PORTFOLIO.length)}</p>
        <p className={s.vHeroBody}>Pick a focus area or a year below the map to narrow it down.</p>
      </div>
      {/* Any press inside the map (a logo, an area, a year) retires the hint. */}
      <div className={clsx(s.vHeroMap, vh.mapFrame)} onClickCapture={() => setUsed(true)}>
        <span className={clsx(vh.hint, { [vh.hintHidden]: used })} aria-hidden>
          <span className={vh.dot} />
          Click any logo to meet the team
          <PointerIcon />
        </span>
        <IslandsMap shape="cube" onOpenProfile={onOpenProfile} />
      </div>
    </section>
  );
};

const islandColor = (id: IslandId) => ISLANDS.find((i) => i.id === id)?.color;

export const VisualContext = () => {
  // The poster first; the YouTube player only loads on press.
  const [playing, setPlaying] = useState(false);

  return (
    <section className={s.vContext} aria-labelledby="v-about">
      <div className={s.vAbout}>
        <span className={s.vEyebrow}>About Protocol Labs</span>
        <h2 id="v-about" className={s.vMission}>
          {PL_CONTEXT.mission}
        </h2>
        <p className={s.vAboutText}>{PL_CONTEXT.about}</p>
        <ul className={s.vFocus}>
          {FOCUS_AREAS.map((a) => (
            <li key={a.island} className={s.vFocusItem}>
              {/* The island's marketing colour, as on the map above. */}
              <span className={s.vFocusHex} style={{ background: islandColor(a.island) }} aria-hidden />
              <span>
                <strong className={s.vFocusName}>{a.name}</strong> {a.line}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <figure className={s.vVideo}>
        <div className={s.vVideoFrame}>
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${PL_VIDEO.id}?autoplay=1&rel=0`}
              title={PL_VIDEO.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className={s.vPoster} onClick={() => setPlaying(true)}>
              <img src={PL_VIDEO.poster} alt="" />
              <span className={s.vPlay} aria-hidden>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 3.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2a.8.8 0 0 0-1.2.7Z" />
                </svg>
              </span>
              <span className={s.srOnly}>Play video: {PL_VIDEO.title}</span>
            </button>
          )}
        </div>
        <figcaption className={s.vVideoCaption}>
          {PL_VIDEO.title} · {PL_VIDEO.channel}
        </figcaption>
      </figure>

      <nav className={s.vEntities} aria-label="Protocol Labs entities">
        <span className={s.vEntitiesLabel}>Part of Protocol Labs</span>
        {PL_ENTITIES.map((e) => (
          <a key={e.name} className={s.vEntity} href={e.href} target="_blank" rel="noopener noreferrer">
            {e.name} ↗
          </a>
        ))}
      </nav>
    </section>
  );
};

const PointerIcon = () => (
  <svg className={vh.pointer} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M4 2.5v9.2l2.3-2.1 1.6 3.7 1.6-.7-1.6-3.6 3.1-.1L4 2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
