import { PL_ENTITIES } from '@/components/page/explore-pl-network/data/content';

import s from './HomeV2.module.scss';

/**
 * The PL entities as one row under the portfolio (2026-11-02 standup: the portfolio and the entities read as one
 * pair). The layout Explore's EditorialIntro gives them (`.edEntities`, five across), as this page's cards. The page
 * supplies the section heading.
 */
export function EntitiesRow() {
  return (
    <ul className={s.entityGrid}>
      {PL_ENTITIES.map((e) => (
        <li key={e.name} className={s.entityItem}>
          <a className={s.entityCard} href={e.href} target="_blank" rel="noopener noreferrer">
            <span className={s.entityName}>{e.name}</span>
            <span className={s.entityLine}>{e.line}</span>
            <span className={s.entityDomain}>
              {e.domain}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M4 8l4-4M4.5 4H8v3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
