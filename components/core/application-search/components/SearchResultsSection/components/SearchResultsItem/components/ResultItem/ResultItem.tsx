import Link from 'next/link';
import Image from 'next/image';
import parse from 'html-react-parser';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { SearchResultsItemProps } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';
import { FoundItem } from '@/services/search/types';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';

import { getFieldLabel } from '../../utils/getFieldLabel';

import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';

interface Props extends SearchResultsItemProps {
  item: FoundItem;
}

export function ResultItem(props: Props) {
  const { item, onSelect } = props;

  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  const defaultAvatar = item.image || getDefaultAvatar(item?.name);
  const matchedName = item.matches.find((match) => match.field === 'name');

  const onClick = useCallback(() => {
    analytics.onSearchResultClick(item);
    onSelect?.();
  }, [item, analytics, onSelect]);

  const link = item.index === 'events' ? item.source?.eventUrl || '' : `/${item.index}/${item.uid}`;

  return (
    <Link href={link} onClick={onClick} target={link.startsWith('http') ? '_blank' : '_self'}>
      <li className={s.foundItem}>
        <div className={s.header}>
          <div className={s.avatar}>
            <Image src={defaultAvatar} alt={item.name} width={24} height={24} />
          </div>
          {matchedName ? (
            <div className={s.name}>{parse(matchedName.content)}</div>
          ) : (
            <div className={s.name}>
              {item.name}
              {/*<HighlightedText text={item.name} query={query} />*/}
            </div>
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
                  <p className={s.text} dangerouslySetInnerHTML={{ __html: match.content }} />
                  <div className={s.matchType}>{getFieldLabel(match.field)}</div>
                </li>
              );
            })}
        </ul>
      </li>
    </Link>
  );
}
