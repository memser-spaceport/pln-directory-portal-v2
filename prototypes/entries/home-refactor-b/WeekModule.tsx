'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Tabs } from '@/components/common/Tabs';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Row = the news card's flat variant (team logo, headline that turns brand on
// hover, hairline between rows): the shape the team profile's news list wears.
import nc from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import { KindGlyph } from './KindGlyph';
import {
  ALL_LATEST_CAP,
  EVENTS_THIS_WEEK_MAX_DAYS,
  KIND_LABEL,
  SEE_ALL,
  WEEK_ROWS,
  inDaysDate,
  isoHoursAgo,
  type WeekKind,
  type WeekRow,
} from './mocks';
import s from './HomeRefactorB.module.scss';

type TabValue = 'all' | WeekKind;

const TAB_ORDER: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'forum', label: 'Forum' },
  { value: 'job', label: 'Jobs' },
  { value: 'repo', label: 'Repos' },
  { value: 'event', label: 'Events' },
];

const eventDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const PAST: WeekRow[] = (['news', 'forum', 'job', 'repo'] as WeekKind[])
  .flatMap((k) => WEEK_ROWS[k])
  .sort((a, b) => (a.hoursAgo ?? 0) - (b.hoursAgo ?? 0));
const EVENTS_THIS_WEEK = WEEK_ROWS.event.filter((e) => (e.inDays ?? 99) <= EVENTS_THIS_WEEK_MAX_DAYS);

export interface WeekModuleProps {
  /** Null until mounted: times are the viewer's clock, never the server's. */
  now: Date | null;
  likeCount: (uid: string) => number;
  commentCount: (uid: string) => number;
  onOpenNews: (uid: string) => void;
  onOpenForum: (uid: string) => void;
}

/**
 * "This week in the network" — ONE module where A has four sections. A
 * segmented control over a compact row list (Plane's "Recent", Record Club's
 * "… this week  See all >"). Every row has the same anatomy whatever its type,
 * so the All tab can interleave them: type glyph + label and time on top, the
 * title, then source and one or two numbers.
 */
export function WeekModule({ now, likeCount, commentCount, onOpenNews, onOpenForum }: WeekModuleProps) {
  const [tab, setTab] = useState<TabValue>('all');

  const count = (k: WeekKind) => (k === 'event' ? WEEK_ROWS.event.length : WEEK_ROWS[k].length);

  const timeOf = (row: WeekRow) => {
    if (!now) return '';
    if (row.inDays != null) return eventDay.format(inDaysDate(now, row.inDays));
    return formatTimeAgo(isoHoursAgo(now, row.hoursAgo ?? 0));
  };

  const metaOf = (row: WeekRow) => {
    const parts = [...row.meta];
    const uid = row.newsUid ?? row.forumUid;
    if (uid) {
      const likes = likeCount(uid);
      const comments = commentCount(uid);
      if (likes) parts.push(`${likes} ${likes === 1 ? 'like' : 'likes'}`);
      if (comments) parts.push(`${comments} ${comments === 1 ? 'comment' : 'comments'}`);
    }
    return parts;
  };

  const renderRow = (row: WeekRow) => {
    const body = (
      <>
        {row.source.logo ? (
          <img className={clsx(nc.logo, row.source.person && s.avatarRound)} src={row.source.logo} alt="" loading="lazy" />
        ) : row.source.person ? (
          <img className={clsx(nc.logo, s.avatarRound)} src={getDefaultAvatar(row.source.name)} alt="" loading="lazy" />
        ) : (
          <div className={nc.logoFallback}>{getTeamLogoFallback(row.source.name)}</div>
        )}
        <span className={s.rowText}>
          <span className={s.rowKicker}>
            <span className={s.kind}>
              <KindGlyph kind={row.kind} />
              {KIND_LABEL[row.kind]}
              {row.subtype && <span className={s.kindSub}>· {row.subtype}</span>}
            </span>
            <span className={s.rowTime} suppressHydrationWarning>
              {timeOf(row)}
            </span>
          </span>
          <span className={clsx(nc.headline, nc.headlineCompact, s.rowTitle)}>{row.title}</span>
          <span className={clsx(nc.meta, s.rowMeta)}>
            <span className={s.rowSource}>{row.source.name}</span>
            {metaOf(row).map((m) => (
              <span key={m} className={s.rowMetaItem}>
                <span className={nc.sep} aria-hidden />
                {m}
              </span>
            ))}
          </span>
        </span>
        {row.external && <span className={s.srOnly}> (opens in a new tab)</span>}
      </>
    );

    const cls = clsx(nc.cardFlat, s.row);
    if (row.newsUid) {
      const uid = row.newsUid;
      return (
        <li key={row.id}>
          <button type="button" className={cls} onClick={() => onOpenNews(uid)}>
            {body}
          </button>
        </li>
      );
    }
    if (row.forumUid) {
      const uid = row.forumUid;
      return (
        <li key={row.id}>
          <button type="button" className={cls} onClick={() => onOpenForum(uid)}>
            {body}
          </button>
        </li>
      );
    }
    return (
      <li key={row.id}>
        <a
          className={cls}
          href={row.href}
          target={row.external ? '_blank' : undefined}
          rel={row.external ? 'noopener noreferrer' : undefined}
        >
          {body}
        </a>
      </li>
    );
  };

  return (
    <section className={clsx(nc.card, s.module)} aria-labelledby="hrb-week-title">
      <div className={s.moduleHead}>
        <h2 id="hrb-week-title" className={s.moduleTitle}>
          This week in the network
        </h2>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        tabs={TAB_ORDER.map((t) => ({
          value: t.value,
          label: t.label,
          badge: t.value === 'all' ? undefined : String(count(t.value)),
        }))}
        classes={{ root: s.tabsRoot, tab: s.tab, badge: s.tabBadge }}
      />

      {tab === 'all' ? (
        <div className={s.lists}>
          {EVENTS_THIS_WEEK.length > 0 && (
            <div>
              <h3 className={s.groupHead}>Coming up this week</h3>
              <ul className={s.rows}>{EVENTS_THIS_WEEK.map(renderRow)}</ul>
            </div>
          )}
          <div>
            <h3 className={s.groupHead}>Latest</h3>
            <ul className={s.rows}>{PAST.slice(0, ALL_LATEST_CAP).map(renderRow)}</ul>
          </div>
        </div>
      ) : (
        <ul className={s.rows}>{WEEK_ROWS[tab].map(renderRow)}</ul>
      )}

      <div className={s.moduleFoot}>
        {tab === 'all' ? (
          <nav className={s.seeAllRow} aria-label="See everything">
            <span className={s.seeAllLabel}>See all</span>
            {(['news', 'forum', 'job', 'repo', 'event'] as WeekKind[]).map((k) => (
              <a key={k} href={SEE_ALL[k].href} className={s.seeAll}>
                {TAB_ORDER.find((t) => t.value === k)!.label}
              </a>
            ))}
          </nav>
        ) : (
          <a href={SEE_ALL[tab].href} className={s.seeAll}>
            {SEE_ALL[tab].label}
            <Arrow />
          </a>
        )}
      </div>
    </section>
  );
}

export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
