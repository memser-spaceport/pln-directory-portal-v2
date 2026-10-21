'use client';

import clsx from 'clsx';

import { Badge } from '@/components/common/Badge/Badge';
import { Button } from '@/components/common/Button';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import local from './HomeRefactorPrototype.module.scss';
import { RepoGlyph, StarGlyph } from './RepoCard';

import type { CuratedRepo } from './mocks';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Selected GitHub repos as ONE announcement band, not a grid of six peer cards.
 *
 * Mobbin references: Airtable's and Kajabi's home banners (a tinted band:
 * badge, headline, one line, one press on the left, a visual on the right) and
 * Better Stack's "Community-built open source" tile. The weekly pick is
 * news, so it reads as an announcement: the lead repo carries the headline
 * and the band's one filled press, and the other picks sit on the right as a
 * compact white list, which is the band's "visual".
 *
 * Paint: brand soft surface + brand-subtle border (lesson 32's soft-brand
 * family), so it is an announcement, not an info alert: no "i" icon, no blue
 * body text. The one fill is the press (lesson 18).
 */
export function RepoBanner({
  repos,
  attribution,
  weekLabel,
}: {
  repos: CuratedRepo[];
  attribution: string;
  weekLabel: string;
}) {
  const [lead, ...rest] = repos;
  const [leadOwner, leadName] = lead.name.split('/');

  return (
    <section className={local.repoBanner} aria-labelledby="home-repos-title">
      <div className={local.repoBannerLead}>
        <div className={local.repoBannerEyebrow}>
          <Badge variant="brand">Open source picks</Badge>
          <span className={local.repoBannerWeek}>{weekLabel}</span>
        </div>

        <h2 id="home-repos-title" className={local.repoBannerTitle}>
          {repos.length} repos from network teams worth a look this week
        </h2>
        <p className={local.repoBannerText}>
          Leading the picks: <strong>{lead.name}</strong>. {lead.description}
        </p>

        <div className={local.repoBannerLeadMeta}>
          <span className={local.metaItem}>
            {/* Inline colour = GitHub's linguist colour for the language (data). */}
            <span className={local.langDot} style={{ background: lead.languageColor }} aria-hidden />
            {lead.language}
          </span>
          <span className={local.metaItem} aria-label={`${lead.stars} stars`}>
            <StarGlyph />
            {compact.format(lead.stars)}
          </span>
          <span className={local.metaItem}>Updated {formatTimeAgo(lead.updatedAt)}</span>
        </div>

        <div className={local.repoBannerActions}>
          <Button
            size="s"
            style="fill"
            variant="primary"
            onClick={() => window.open(lead.url, '_blank', 'noopener,noreferrer')}
            aria-label={`Open ${leadOwner}/${leadName} on GitHub`}
          >
            <span className={local.repoBannerBtnInner}>
              View {leadName} on GitHub
              <ExternalGlyph />
            </span>
          </Button>
          <span className={local.repoBannerAttribution}>{attribution}</span>
        </div>
      </div>

      <div className={local.repoBannerList}>
        <p className={local.repoBannerListHead}>Also picked</p>
        <ul>
          {rest.map((repo) => {
            const [owner, name] = repo.name.split('/');
            return (
              <li key={repo.name}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={local.repoBannerRow}
                  aria-label={`${repo.name} on GitHub, by ${repo.teamName}`}
                >
                  {repo.teamLogoUrl ? (
                    <img className={clsx(s.logo, local.jobLogo)} src={repo.teamLogoUrl} alt="" loading="lazy" />
                  ) : (
                    <div className={clsx(s.logoFallback, local.jobLogo)}>{getTeamLogoFallback(repo.teamName)}</div>
                  )}
                  <span className={local.repoBannerRowText}>
                    <span className={local.repoBannerRowName}>
                      <span className={local.repoOwner}>{owner}/</span>
                      {name}
                    </span>
                    <span className={local.repoBannerRowMeta}>
                      <span className={local.langDot} style={{ background: repo.languageColor }} aria-hidden />
                      {repo.language}
                      <span aria-hidden>·</span>
                      <StarGlyph />
                      {compact.format(repo.stars)}
                    </span>
                  </span>
                  <span className={local.repoBannerRowGlyph} aria-hidden>
                    <RepoGlyph />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Stroked ↗ — the outbound mark the card's other external links use. */
function ExternalGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3.5h6.5V10M12.25 3.75 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
