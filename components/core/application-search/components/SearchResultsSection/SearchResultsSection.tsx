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

interface Props {
  title?: string;
  items: FoundItem[] | ForumFoundItem[];
  query: string;
  onSelect?: () => void;
}

const SECTION_TYPE_ICONS = {
  teams: '/icons/teams.svg',
  members: '/icons/members.svg',
  projects: '/icons/projects.svg',
  events: '/icons/irl-event-default-logo.svg',
  forumThreads: '/icons/chat.svg',
};

export const SearchResultsSection = ({ title, items, query, onSelect }: Props) => {
  const router = useRouter();
  const analytics = useUnifiedSearchAnalytics();

  return (
    <>
      <div className={s.root}>
        {title && (
          <div className={s.label}>
            {title} ({items.length})
          </div>
        )}
        <ul className={s.list}>
          {items.map((item) => {
            const defaultAvatar = item.image || getDefaultAvatar(item?.name);

            if (item.index === 'forumThreads') {
              const matchedName = item.matches.find((match) => match.field === 'name');

              const commentsMatches = item.matches.filter((match) => match.field === 'replies.content');

              return (
                <li
                  key={item.uid}
                  className={s.foundItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    analytics.onSearchResultClick(item);
                    router.push(`/forum/${item.uid}`);
                    onSelect?.();
                  }}
                >
                  <div className={s.header}>
                    <div className={s.avatar}>
                      <Image src={defaultAvatar} alt={item.name} width={24} height={24} />
                    </div>
                    {matchedName ? (
                      <div className={s.name} dangerouslySetInnerHTML={{ __html: matchedName.content }} />
                    ) : (
                      <div className={s.name}>
                        {item.name}
                        {/*<HighlightedText text={item.name} query={query} />*/}
                      </div>
                    )}
                  </div>
                  <ul className={s.matches}>
                    {item.matches
                      .filter((match) => match.field !== 'name' && match.field !== 'topicUrl' && match.field !== 'topicSlug' && match.field !== 'topicTitle' && match.field !== 'replies.content')
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
                      Posted by {item.source.rootPost.author.name} &bull; {formatDistanceToNow(new Date(item.source.rootPost.timestamp), { addSuffix: true })}
                    </li>
                  </ul>

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
                        <div className={s.header}>
                          <div className={s.avatar}>
                            <Image src={_defaultAvatar} alt={comm.author.name} width={24} height={24} />
                          </div>
                          <div className={s.text} dangerouslySetInnerHTML={{ __html: match.content }} />
                        </div>
                        <div className={s.postDetails}>
                          Commented by {comm.author.name} &bull; {formatDistanceToNow(new Date(comm.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    );
                  })}
                </li>
              );
            }

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
                  <div className={s.name}>
                    {item.name}
                    {/*<HighlightedText text={item.name} query={query} />*/}
                  </div>
                  <div className={s.type}>
                    <Image src={SECTION_TYPE_ICONS[item.index]} alt={item.name} width={14} height={14} />
                  </div>
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
          })}
        </ul>
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
