'use client';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './DomainMigrationBanner.module.scss';

const NEW_DOMAIN = 'os.pl.xyz';

export function DomainMigrationBanner() {
  if (!NEW_DOMAIN) {
    return null;
  }

  return (
    <HighlightsBar>
      <div className={s.root}>
        We&apos;ve moved to{' '}
        <a href={`https://${NEW_DOMAIN}`} className={s.link}>
          {NEW_DOMAIN}
        </a>
        . Please update your bookmarks and saved links.
      </div>
    </HighlightsBar>
  );
}
