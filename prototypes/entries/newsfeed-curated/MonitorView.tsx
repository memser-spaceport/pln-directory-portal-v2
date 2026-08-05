'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { ALL_CAT, CATEGORIES } from '@/components/page/home/TeamNews/constants';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { SECTOR_TAG_LABEL } from '@/services/investors/constants';
import type { SectorTag } from '@/services/investors/types';

// Production news-card shell + the job board's alert chrome, both reused 1:1 —
// the same two modules `../newsfeed-v0/SavedFilterBanner` composes.
import card from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import { JobAlertShell } from '@/components/page/jobs/JobAlertShell/JobAlertShell';
import banner from '@/components/page/jobs/JobAlertBanner/JobAlertBanner.module.scss';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { ACTIVE_SECTORS, SECTOR_BY_UID } from './mocks';
import type { Subscription } from './subscription';

const ANY = 'any';

/** The standing query: an event class intersected with a sector. */
export interface MonitorQuery {
  eventType: TeamNewsEventType | typeof ANY;
  sector: SectorTag | typeof ANY;
}

export const DEFAULT_QUERY: MonitorQuery = { eventType: 'FUNDING', sector: 'robotics' };

/** Identity of a query, so a subscription made here compares with one made in the feed. */
const queryKey = (q: MonitorQuery) => `event=${q.eventType}&sector=${q.sector}`;

function describe(q: MonitorQuery): string {
  const event = q.eventType === ANY ? 'All updates' : EVENT_TYPE_LABEL[q.eventType];
  const sector = q.sector === ANY ? 'any sector' : SECTOR_TAG_LABEL[q.sector];
  return `${event} in ${sector}`;
}

interface MonitorViewProps {
  /** The same corpus the Read path shows — the two surfaces must not disagree. */
  items: ITeamNewsItem[];
  /** Owned by the page, not this view — the feed can create the same object. */
  subscription: Subscription | null;
  onSubscribe: (subscription: Subscription) => void;
}

/**
 * Path 2 — Monitor. "What fundings are new in robotics?"
 *
 * Deliberately *not* a feed. No hero, no team clustering, no editorial ordering:
 * this is a standing query whose success metric is recall, not engagement. The
 * user decides what is relevant, and the only failure that matters is a miss.
 *
 * That inversion is why it earns its own surface rather than another tab on the
 * feed. It also carries a much higher data bar — which is what the coverage line
 * at the bottom exists to make visible. Editorial survives gappy tagging because
 * a human curator picks around the gaps; a standing alert cannot, and the reader
 * has no way to see what never reached them.
 *
 * The alert chrome is the job board's, reused rather than reinvented: production
 * already ships this exact shape at `components/page/jobs/JobAlertBanner`.
 */
export function MonitorView({ items, subscription, onSubscribe }: MonitorViewProps) {
  const [query, setQuery] = useState<MonitorQuery>(DEFAULT_QUERY);

  const subscribe = () => onSubscribe({ key: queryKey(query), label: describe(query), source: 'monitor' });

  const eventOptions = useMemo(
    () => [
      { value: ANY, label: 'All updates' },
      ...CATEGORIES.filter((c) => c.id !== ALL_CAT).map((c) => ({ value: c.id, label: c.label })),
    ],
    [],
  );

  const sectorOptions = useMemo(
    () => [
      { value: ANY, label: 'Any sector' },
      ...ACTIVE_SECTORS.map((s) => ({ value: s, label: SECTOR_TAG_LABEL[s] })),
    ],
    [],
  );

  const matches = useMemo(
    () =>
      items.filter((i) => {
        if (query.eventType !== ANY && i.eventType !== query.eventType) return false;
        if (query.sector !== ANY && SECTOR_BY_UID[i.uid] !== query.sector) return false;
        return true;
      }),
    [items, query],
  );

  // The number that makes the data bar concrete. An unclassified item can never
  // match a sector query, and nothing in the UI would otherwise say so.
  const unclassified = useMemo(() => items.filter((i) => !SECTOR_BY_UID[i.uid]), [items]);

  const alertMatches = subscription !== null && subscription.key === queryKey(query);

  return (
    <div className={local.monitor}>
      <header className={local.monitorHead}>
        <h2 className={clsx(v0.sectionTitle, local.monitorTitle)}>Monitor</h2>
        <p className={local.monitorSub}>
          A standing query over the same week of network news. You decide what counts; the only failure that matters is
          a miss.
        </p>
      </header>

      <div className={local.queryBar}>
        <SortDropdown
          sortByLabel="Event:"
          options={eventOptions}
          currentSort={query.eventType}
          onSortChange={(value) => setQuery((q) => ({ ...q, eventType: value as MonitorQuery['eventType'] }))}
        />
        <SortDropdown
          sortByLabel="Sector:"
          options={sectorOptions}
          currentSort={query.sector}
          onSortChange={(value) => setQuery((q) => ({ ...q, sector: value as MonitorQuery['sector'] }))}
        />
      </div>

      {/* Set → reconcile → matched, exactly the three states JobAlertBanner ships. */}
      {!subscription && (
        <JobAlertShell>
          <div className={banner.body}>
            <div className={banner.copy}>
              {/* In-app notifications, matching `SubscribeBanner` — the two doors
                  create one Subscription, so they must promise the same thing. */}
              <p className={banner.title}>Get notified when new items match this query.</p>
              <p className={banner.subtitle}>
                We&apos;ll send it to your notifications, only when there are new matches.
              </p>
            </div>
          </div>
          <div className={banner.actions}>
            <Button size="m" type="button" style="fill" variant="primary" onClick={subscribe}>
              Set alert
            </Button>
          </div>
        </JobAlertShell>
      )}

      {/* The reconcile state now also catches a subscription made from the feed —
          same object, so Monitor reports it rather than pretending none exists. */}
      {subscription && !alertMatches && (
        <JobAlertShell>
          <div className={banner.body}>
            <div className={banner.copy}>
              <p className={banner.title}>This query differs from your subscription.</p>
              <p className={banner.subtitle}>
                You&apos;re subscribed to <strong>{subscription.label}</strong>
                {subscription.source === 'feed' && ', set from a feed filter'}. Update it to switch.
              </p>
            </div>
          </div>
          <div className={banner.actions}>
            <Button size="m" type="button" style="border" variant="primary" onClick={subscribe}>
              Update subscription
            </Button>
          </div>
        </JobAlertShell>
      )}

      <div className={local.monitorCount}>
        <strong>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </strong>{' '}
        this week for <strong>{describe(query)}</strong>
        {alertMatches && <span className={local.alertOn}>Alert on</span>}
      </div>

      {matches.length === 0 ? (
        <p className={local.monitorEmpty}>
          Nothing matched this week. An alert still makes sense — it exists to tell you when something does.
        </p>
      ) : (
        <ul className={local.matchList}>
          {matches.map((item) => (
            <li key={item.uid} className={clsx(card.card, local.matchRow)}>
              {item.teamLogoUrl ? (
                <img className={card.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
              ) : (
                <div className={card.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
              )}
              <div className={local.matchBody}>
                <a href={item.sourceUrl ?? '#'} target="_blank" rel="noopener noreferrer" className={local.matchTitle}>
                  {item.title}
                </a>
                <span className={local.matchMeta}>
                  {item.teamName}
                  {' · '}
                  {EVENT_TYPE_LABEL[item.eventType]}
                  {SECTOR_BY_UID[item.uid] && ` · ${SECTOR_TAG_LABEL[SECTOR_BY_UID[item.uid]]}`}
                  {' · '}
                  {formatTimeAgo(item.eventDate)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* The point of this whole surface, stated as a number. */}
      <div className={local.coverageWarn}>
        <strong>
          {unclassified.length} of {items.length} items this week carry no sector.
        </strong>{' '}
        They cannot match any alert, and nobody waiting on one would ever know. Editorial works around gaps like these;
        a standing query cannot — which is why Monitor needs a tagging guarantee that the feed does not.
      </div>
    </div>
  );
}
