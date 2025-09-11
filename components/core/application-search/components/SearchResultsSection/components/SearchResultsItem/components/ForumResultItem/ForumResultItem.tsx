import React from 'react';
import Image from 'next/image';
import parse from 'html-react-parser';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { SearchResultsItemProps } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ForumFoundItem } from '@/services/search/types';
import { getFieldLabel } from '../../utils/getFieldLabel';

import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';

interface Props extends SearchResultsItemProps {
  item: ForumFoundItem;
}

export function ForumResultItem(props: Props) {
  const { item, onSelect } = props;

  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  const defaultAvatar = item?.source?.rootPost?.author?.image || getDefaultAvatar(item?.name);
  const matchedName = item.matches.find((match) => match.field === 'name');

  const commentsMatches = item.matches.filter((match) => match.field === 'replies.content');
  const rootPostAuthorMatches = item.matches.filter((match) => match.field === 'rootPost.author.name');
  // const repliesAuthorMatches = item.matches.filter((match) => match.field === 'replies.author.name');

  return (
    <li
      className={s.foundItem}
      onClick={(e) => {
        e.stopPropagation();
        analytics.onSearchResultClick(item);
        router.push(`/forum/topics/${item.source.cid}/${item.source.tid}`);
        onSelect?.();
      }}
    >
      <div className={s.contentWrapper}>
        <div className={s.header}>
          <div className={s.avatar}>
            <Image src={defaultAvatar} alt={item.name} width={24} height={24} />
          </div>
          {matchedName ? (
            <div className={s.name}>{parse(matchedName.content)}</div>
          ) : (
            <div className={s.name}>
              {parse(item.name)}
              {/*<HighlightedText text={item.name} query={query} />*/}
            </div>
          )}
        </div>
        <ul className={s.matches}>
          {item.matches
            .filter(
              (match) =>
                match.field !== 'name' &&
                match.field !== 'topicUrl' &&
                match.field !== 'topicSlug' &&
                match.field !== 'topicTitle' &&
                match.field !== 'replies.content' &&
                match.field !== 'rootPost.author.name' &&
                match.field !== 'replies.author.name',
            )
            .map((match) => {
              return (
                <li key={match.field} className={s.matchRow}>
                  <div className={s.arrow}>
                    <Image src="/icons/row-arrow.svg" alt={item.name} width={26} height={26} />
                  </div>
                  <div className={s.text}>{parse(match.content)}</div>
                  <div className={s.matchType}>{getFieldLabel(match.field)}</div>
                </li>
              );
            })}
          <li className={s.postDetails}>
            Posted by {rootPostAuthorMatches?.length ? <span className={s.text}>{parse(rootPostAuthorMatches[0].content)}</span> : <span className={s.text}>{item.source.rootPost.author.name}</span>}{' '}
            &bull; {formatDistanceToNow(new Date(item.source.rootPost.timestamp), { addSuffix: true })}
          </li>
        </ul>
      </div>
      {commentsMatches.map((match) => {
        const comm = item.source.replies.find((reply) => reply.pid === match.pid);
        const _defaultAvatar = comm?.author?.image || getDefaultAvatar(comm?.author?.name);

        if (!comm) {
          return;
        }

        return (
          <div
            key={comm.pid}
            onClick={(e) => {
              e.stopPropagation();
              analytics.onSearchResultClick(item);
              router.push(`/forum/topics/${item.source.cid}/${item.source.tid}?pid=${comm.pid}`);
              onSelect?.();
            }}
          >
            <div className={s.contentWrapper}>
              <div className={s.header}>
                <div className={s.avatar}>
                  <Image src={_defaultAvatar} alt={comm.author.name} width={24} height={24} />
                </div>
                <div className={s.text}>{parse(match.content)}</div>
              </div>
              <div className={s.postDetails}>
                Commented by {comm.author.name} &bull; {formatDistanceToNow(new Date(comm.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        );
      })}
    </li>
  );
}
