import React from 'react';

import { AllFoundItems } from './types';

import { ResultsList } from './components/ResultsList';
import { Top50Results } from './components/Top50Results';
import { SearchResultsItem } from './components/SearchResultsItem';

import s from './SearchResultsSection.module.scss';

interface Props {
  title?: string;
  items: AllFoundItems;
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

export const SearchResultsSection = (props: Props) => {
  const { title, items, groupItems = false, onSelect } = props;

  const itemsCount = items.length;

  if (groupItems) {
    return (
      <ResultsList title={title} itemsCount={itemsCount}>
        <Top50Results items={items} onSelect={onSelect} />
      </ResultsList>
    );
  }

  return (
    <ResultsList title={title} itemsCount={itemsCount}>
      <ul className={s.list}>
        {items.map((item) => (
          <SearchResultsItem key={item.uid} item={item} onSelect={onSelect} />
        ))}
      </ul>
    </ResultsList>
  );
};
