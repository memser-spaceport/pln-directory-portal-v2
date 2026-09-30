import React from 'react';
import { PORTFOLIO } from '../data/islands';
import { EDITORIAL_HEADER, FOCUS_AREAS, PL_CONTEXT, PL_ENTITIES, PL_FACTS } from '../data/content';
import s from './EditorialIntro.module.scss';

type Props = {
  onEntityClicked?: (name: string) => void;
};

/**
 * Reads like an institutional About page: centred, type and hairlines only,
 * no imagery above the portfolio.
 * 1. Statement: marketing's General Info text, mission as the lede.
 * 2. Key figures.
 * 3. Focus areas, in marketing's words.
 * 4. The PL entities as linked cards.
 */
export const EditorialIntro = ({ onEntityClicked }: Props) => (
  <div className={s.editorial}>
    <header className={s.edHeader}>
      <span className={s.edOverline}>{EDITORIAL_HEADER.overline}</span>
      <h1 className={s.edTitle}>{EDITORIAL_HEADER.title}</h1>
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
        </div>
      ))}
    </dl>

    <section className={s.edSection} aria-labelledby="ed-focus">
      <h2 id="ed-focus" className={s.edSectionTitle}>
        Focus areas
      </h2>
      <ol className={s.edFocus}>
        {FOCUS_AREAS.map((a, i) => (
          <li key={a.id} className={s.edFocusItem}>
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
            <a
              className={s.edEntity}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onEntityClicked?.(e.name)}
            >
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
