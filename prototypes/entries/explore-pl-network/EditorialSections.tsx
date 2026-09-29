'use client';

import React from 'react';
import { PORTFOLIO } from './islands';
import { DIRECTION_COPY, FOCUS_AREAS, PL_CONTEXT, PL_ENTITIES, PL_FACTS } from './mocks';
import s from './ExplorePlNetwork.module.scss';

/**
 * Direction A — Editorial (2026-09-29 sync: "more official, links to PL
 * Capital etc."). Reads like an institutional About page or an annual report:
 * centred, type and hairlines only, no imagery above the portfolio.
 * 1. Statement: marketing's General Info text, mission as the lede.
 * 2. Key figures, each with where it comes from.
 * 3. Focus areas, in marketing's words.
 * 4. The PL entities as linked cards (PL R&D, PL Capital, PLVS, …).
 * The portfolio, logo wall, FAQ and footer follow from the page.
 */
export const EditorialIntro = () => {
  const copy = DIRECTION_COPY.editorial;

  return (
    <div className={s.editorial}>
      <header className={s.edHeader}>
        <span className={s.edOverline}>{copy.overline}</span>
        <h1 className={s.edTitle}>{copy.title}</h1>
        <p className={s.edLede}>{PL_CONTEXT.mission}</p>
        <div className={s.edBody}>
          <p>{PL_CONTEXT.about}</p>
          <p>{PL_CONTEXT.origin}</p>
        </div>
      </header>

      <dl className={s.edFacts}>
        {PL_FACTS.map((f) => (
          <div key={f.label} className={s.edFact}>
            <dt className={s.edFactLabel}>{f.label}</dt>
            <dd className={s.edFactValue}>{f.value === 'portfolio' ? PORTFOLIO.length : f.value}</dd>
            <dd className={s.edFactSource}>{f.source === 'Listed below' ? f.source : `Source: ${f.source}`}</dd>
          </div>
        ))}
      </dl>

      <section className={s.edSection} aria-labelledby="ed-focus">
        <h2 id="ed-focus" className={s.edSectionTitle}>
          Focus areas
        </h2>
        <ol className={s.edFocus}>
          {FOCUS_AREAS.map((a, i) => (
            <li key={a.island} className={s.edFocusItem}>
              <span className={s.edFocusIndex}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={s.edFocusName}>{a.name}</h3>
              <p className={s.edFocusLine}>{a.line}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.edSection} aria-labelledby="ed-entities">
        <h2 id="ed-entities" className={s.edSectionTitle}>
          Protocol Labs entities
        </h2>
        <ul className={s.edEntities}>
          {PL_ENTITIES.map((e) => (
            <li key={e.name}>
              <a className={s.edEntity} href={e.href} target="_blank" rel="noopener noreferrer">
                <span className={s.edEntityName}>{e.name}</span>
                <span className={s.edEntityLine}>{e.line}</span>
                <span className={s.edEntityDomain}>{e.domain} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
