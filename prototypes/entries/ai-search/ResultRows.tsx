'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import parse from 'html-react-parser';
import clsx from 'clsx';

import type { FoundItem, ForumFoundItem } from '@/services/search/types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';
import { SearchResultsItem } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';
import { getGroupTitleByGroupName } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/utils/getGroupTitleByGroupName';

// Production's own row stylesheet, so the transcription cannot drift from it.
import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';
import top from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/Top50Results.module.scss';

import local from './ResultRows.module.scss';

type AnyItem = FoundItem | ForumFoundItem;

interface ResultRowsProps {
  items: AnyItem[];
  /** The Top group: rows grouped under their index, as production's `Top50Results` does. */
  grouped?: boolean;
  onSelect?: () => void;
  /** A team or member row's action: ask the AI view about that record. */
  onAskAbout?: (item: FoundItem) => void;
}

const GROUP_ORDER = ['members', 'teams', 'projects', 'events', 'forumThreads'];

/**
 * COPY-SIMPLIFY of production's `SearchResultsSection` → `ResultItem`.
 *
 * Transcribed for one reason: production's row is a `Link` wrapping the
 * whole `<li>`, so nothing else can be pressed inside it, and team and member
 * rows need a second press — **Ask AI**, which opens the AI view with that
 * record as the scope chip. A search for "protocol labs" finds the team;
 * "ask about it" should mean the team, not the two words, and a row is the
 * object where the pinned band above can only offer the term.
 *
 * The action stays visible on team and member rows, so asking about a record
 * is discoverable without hover. Projects, events and forum threads do not
 * carry it; an event row already leaves for the organiser's site.
 *
 * A member row can also carry production's "Available to connect" badge at
 * the right of its name line, which is exactly where the action appears. The
 * action does not cover it: every askable row reserves the action's width
 * at the end of its header, so the badge (and a long name) stop short of it
 * beside the persistent action without overlapping it.
 *
 * What is dropped from the source: `useUnifiedSearchAnalytics` (no PostHog
 * here) and `useRouter` (unused there too). Forum rows are production's own
 * `ForumResultItem`, via `SearchResultsItem`, untouched. The Top group's
 * "show all" past five per index is not carried: the mocked corpus never
 * reaches it.
 */
export function ResultRows({ items, grouped = false, onSelect, onAskAbout }: ResultRowsProps) {
  if (!grouped) {
    return (
      <ul className={s.list}>
        {items.map((item) => (
          <Row key={item.uid} item={item} onSelect={onSelect} onAskAbout={onAskAbout} />
        ))}
      </ul>
    );
  }

  const groups = GROUP_ORDER.map((g) => [g, items.filter((i) => i.index === g)] as const).filter(
    ([, list]) => list.length,
  );
  return (
    <>
      {groups.map(([group, list]) => (
        <div key={group}>
          <div className={top.groupTitle}>{getGroupTitleByGroupName(group)}</div>
          <ul className={s.list}>
            {list.map((item) => (
              <Row key={item.uid} item={item} onSelect={onSelect} onAskAbout={onAskAbout} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Row({
  item,
  onSelect,
  onAskAbout,
}: {
  item: AnyItem;
  onSelect?: () => void;
  onAskAbout?: (item: FoundItem) => void;
}) {
  if (item.index === 'forumThreads') return <SearchResultsItem item={item} onSelect={onSelect} />;

  const found = item as FoundItem;
  const avatar = found.image || getDefaultAvatar(found.name);
  const matchedName = found.matches.find((m) => m.field === 'name');
  const link = found.index === 'events' ? found.source?.eventUrl || '' : `/${found.index}/${found.uid}`;
  const external = link.startsWith('http');
  const askable = (found.index === 'teams' || found.index === 'members') && !!onAskAbout;

  /* Production: `<Link><li class="foundItem">…</li></Link>`. Here the `<li>`
     is the host and the link is a block inside it, so the action can be a
     sibling of the link rather than a button inside an anchor. `.foundItem`'s
     padding, border and hover stay on the `<li>`, where production has them. */
  return (
    <li className={clsx(s.foundItem, local.host)}>
      <Link
        href={link}
        className={local.link}
        target={external ? '_blank' : '_self'}
        onClick={() => {
          if (found.index !== 'events') onSelect?.();
        }}
      >
        <div className={clsx(s.header, askable && local.headerAskable)}>
          <div className={s.avatar}>
            <Image src={avatar} alt={found.name} width={24} height={24} />
          </div>
          <div className={s.name}>{matchedName ? parse(matchedName.content) : found.name}</div>
          {!!found.availableToConnect && (
            <div className={s.type}>
              <OhBadge variant="primary" />
            </div>
          )}
        </div>
        <ul className={s.matches}>
          {found.matches
            .filter((m) => m.field !== 'name')
            .map((m) => (
              <li key={m.field} className={s.matchRow}>
                <div className={s.arrow}>
                  <Image src="/icons/row-arrow.svg" alt="" width={26} height={26} />
                </div>
                <p className={s.text} dangerouslySetInnerHTML={{ __html: m.content }} />
              </li>
            ))}
        </ul>
      </Link>

      {askable && (
        <button
          type="button"
          className={local.ask}
          onClick={() => onAskAbout!(found)}
          aria-label={`Ask AI about ${found.name}`}
        >
          <AiSearchIcon size={16} />
          Ask AI
        </button>
      )}
    </li>
  );
}
