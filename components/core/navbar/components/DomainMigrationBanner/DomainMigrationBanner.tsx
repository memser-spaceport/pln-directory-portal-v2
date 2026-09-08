'use client';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './DomainMigrationBanner.module.scss';

const OLD_DOMAIN = 'directory.plnetwork.io';
const NEW_DOMAIN = 'os.pl.xyz';

export function DomainMigrationBanner() {
  if (!NEW_DOMAIN) {
    return null;
  }

  return (
    <HighlightsBar>
      <div className={s.root}>
        We&apos;re moving from {OLD_DOMAIN} to{' '}
        <a href={`https://${NEW_DOMAIN}`} className={s.link}>
          {NEW_DOMAIN}
        </a>
        . You may hit temporary login or access issues.
      </div>
    </HighlightsBar>
  );
}
