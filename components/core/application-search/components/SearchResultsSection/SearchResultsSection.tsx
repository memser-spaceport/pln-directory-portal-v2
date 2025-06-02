import React from 'react';
import Image from 'next/image';

import s from './SearchResultsSection.module.scss';
import { FoundItem } from '@/services/search/types';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// import { HighlightedText } from '@/components/core/application-search/components/HighlightedText';
import { useRouter } from 'next/navigation';

interface Props {
  title?: string;
  items: FoundItem[];
  query: string;
  onSelect?: () => void;
}

const SECTION_TYPE_ICONS = {
  teams: '/icons/teams.svg',
  members: '/icons/members.svg',
  projects: '/icons/projects.svg',
  events: '/icons/irl-event-default-logo.svg',
};

export const SearchResultsSection = ({ title, items, query, onSelect }: Props) => {
  const router = useRouter();

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

            return (
              <li
                key={item.uid}
                className={s.foundItem}
                onClick={() => {
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
                  {item.matches.map((match) => {
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
