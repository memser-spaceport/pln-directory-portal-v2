import { ForumFoundItem, FoundItem } from '@/services/search/types';

export type State = Record<
  string,
  {
    items: (FoundItem | ForumFoundItem)[];
    hasMore: boolean;
    showAll: boolean;
  }
>;

export type Action =
  | {
      type: 'setInitialState';
      payload: State;
    }
  | {
      type: 'setShowAll';
      payload: {
        groupName: string;
        showAll: boolean;
      };
    };
