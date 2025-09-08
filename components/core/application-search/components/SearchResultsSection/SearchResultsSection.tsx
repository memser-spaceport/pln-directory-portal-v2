import React from 'react';
import Image from 'next/image';

import s from './SearchResultsSection.module.scss';
import { ForumFoundItem, FoundItem } from '@/services/search/types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// import { HighlightedText } from '@/components/core/application-search/components/HighlightedText';
import { useRouter } from 'next/navigation';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { formatDistanceToNow } from 'date-fns';
import parse from 'html-react-parser';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';

interface Props {
  title?: string;
  items: FoundItem[] | ForumFoundItem[];
  query: string;
  onSelect?: () => void;
  groupItems?: boolean;
}

const SECTION_TYPE_ICONS = {
  teams: '/icons/teams.svg',
  members: '/icons/members.svg',
  projects: '/icons/projects.svg',
  events: '/icons/irl-event-default-logo.svg',
  forumThreads: '/icons/chat.svg',
};

// Helper function to group items by their index field
const groupItemsByIndex = (items: (FoundItem | ForumFoundItem)[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const index = item.index;
      if (!acc[index]) {
        acc[index] = [];
      }
      acc[index].push(item);
      return acc;
    },
    {} as Record<string, (FoundItem | ForumFoundItem)[]>,
  );

  return grouped;
};

// Helper function to get display name for index
const getIndexDisplayName = (index: string) => {
  switch (index) {
    case 'members':
      return 'Members';
    case 'teams':
      return 'Teams';
    case 'projects':
      return 'Projects';
    case 'events':
      return 'Events';
    case 'forumThreads':
      return 'Forum';
    default:
      return index.charAt(0).toUpperCase() + index.slice(1);
  }
};

export const SearchResultsSection = ({ title, items, query, onSelect, groupItems = false }: Props) => {
  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  // Function to render a single item
  const renderItem = (item: FoundItem | ForumFoundItem) => {
    if (item.index === 'forumThreads') {
      const defaultAvatar = item?.source?.rootPost?.author?.image || getDefaultAvatar(item?.name);
      const matchedName = item.matches.find((match) => match.field === 'name');

      const commentsMatches = item.matches.filter((match) => match.field === 'replies.content');
      const rootPostAuthorMatches = item.matches.filter((match) => match.field === 'rootPost.author.name');
      // const repliesAuthorMatches = item.matches.filter((match) => match.field === 'replies.author.name');

      return (
        <li
          key={item.uid}
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
                Posted by{' '}
                {rootPostAuthorMatches?.length ? <span className={s.text}>{parse(rootPostAuthorMatches[0].content)}</span> : <span className={s.text}>{item.source.rootPost.author.name}</span>} &bull;{' '}
                {formatDistanceToNow(new Date(item.source.rootPost.timestamp), { addSuffix: true })}
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

    const defaultAvatar = item.image || getDefaultAvatar(item?.name);
    const matchedName = item.matches.find((match) => match.field === 'name');

    return (
      <li
        key={item.uid}
        className={s.foundItem}
        onClick={() => {
          analytics.onSearchResultClick(item);
          router.push(`/${item.index}/${item.uid}`);
          onSelect?.();
        }}
      >
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
    );
  };

  if (groupItems) {
    const groupedItems = groupItemsByIndex(items);

    return (
      <>
        <div className={s.root}>
          {title && (
            <div className={s.label}>
              {title} ({items.length})
            </div>
          )}
          {Object.entries(groupedItems).map(([index, groupItems]) => (
            <div key={index}>
              <div className={s.groupTitle}>{getIndexDisplayName(index)}</div>
              <ul className={s.list}>{groupItems.map((item) => renderItem(item))}</ul>
            </div>
          ))}
        </div>
        <div className={s.divider} />
      </>
    );
  }

  return (
    <>
      <div className={s.root}>
        {title && (
          <div className={s.label}>
            {title} ({items.length})
          </div>
        )}
        <ul className={s.list}>{items.map((item) => renderItem(item))}</ul>
      </div>
      <div className={s.divider} />
    </>
  );
};

function getFieldLabel(field: string) {
  switch (field.toLowerCase()) {
    case 'shortdescription':
    case 'longdescription': {
      return 'Description';
    }
    case 'tagline': {
      return 'Tags';
    }
    default: {
      return field;
    }
  }
}
