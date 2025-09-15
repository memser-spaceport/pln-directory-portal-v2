import React from 'react';

import { ForumFoundItem, FoundItem } from '@/services/search/types';

import { ResultItem } from './components/ResultItem';
import { ForumResultItem } from './components/ForumResultItem/ForumResultItem';

export interface SearchResultsItemProps {
  item: FoundItem | ForumFoundItem;
  onSelect?: () => void;
}

export function SearchResultsItem(props: SearchResultsItemProps) {
  const { item, onSelect } = props;

  if (item.index === 'forumThreads') {
    return <ForumResultItem item={item} onSelect={onSelect} />;
  }

  return <ResultItem item={item} onSelect={onSelect} />;
}
