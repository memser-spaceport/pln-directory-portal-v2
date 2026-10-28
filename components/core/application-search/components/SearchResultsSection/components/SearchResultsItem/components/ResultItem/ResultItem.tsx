import Link from 'next/link';
import Image from 'next/image';
import React, { useCallback } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

import { SearchResultsItemProps } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';
import { FoundItem } from '@/services/search/types';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';

import { getFieldLabel } from '../../utils/getFieldLabel';

import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';
import { parseSafeHtml } from '@/utils/html';
import { SafeHtml } from '@/components/ui/SafeHtml';

interface Props extends SearchResultsItemProps {
  item: FoundItem;
}

export function ResultItem(props: Props) {
  const { item, onSelect, onAskAi } = props;

  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  const defaultAvatar = item.image || getDefaultAvatar(item?.name);
  const matchedName = item.matches.find((match) => match.field === 'name');
  // Teams and members have a profile for AI Search to answer about.
  const askAi = item.index === 'teams' || item.index === 'members' ? onAskAi : undefined;

  const onClick = useCallback(() => {
    analytics.onSearchResultClick(item);

    if (item.index !== 'events') {
      onSelect?.();
    }
  }, [item, analytics, onSelect]);

  const link = item.index === 'events' ? item.source?.eventUrl || '' : `/${item.index}/${item.uid}`;

  return (
    <li className={clsx(s.foundItem, s.foundItemHost)}>
      <Link
        href={link}
        onClick={onClick}
        target={link.startsWith('http') ? '_blank' : '_self'}
        className={s.foundItemLink}
      >
        <div className={clsx(s.header, askAi && s.headerAskable)}>
          <div className={s.avatar}>
            <Image src={defaultAvatar} alt={item.name} width={24} height={24} />
          </div>
          {matchedName ? (
            <div className={s.name}>{parseSafeHtml(matchedName.content, 'searchHighlight')}</div>
          ) : (
            <div className={s.name}>{item.name}</div>
          )}
          {!!item.availableToConnect && (
            <div className={s.type}>
              <OhBadge variant="primary" />
            </div>
          )}
        </div>
        <ul className={s.matches}>
          {item.matches
            .filter((match) => match.field !== 'name')
            .map((match) => {
              return (
                <li key={match.field} className={s.matchRow}>
                  <div className={s.arrow}>
                    <Image src="/icons/row-arrow.svg" alt={item.name} width={26} height={26} />
                  </div>
                  <SafeHtml as="p" className={s.text} profile="searchHighlight" html={match.content} />
                  <div className={s.matchType}>{getFieldLabel(match.field)}</div>
                </li>
              );
            })}
        </ul>
      </Link>
      {askAi && (
        <button type="button" className={s.askAi} onClick={() => askAi(item)}>
          <span className={s.askAiIcon} aria-hidden="true" />
          Ask AI
        </button>
      )}
    </li>
  );
}
