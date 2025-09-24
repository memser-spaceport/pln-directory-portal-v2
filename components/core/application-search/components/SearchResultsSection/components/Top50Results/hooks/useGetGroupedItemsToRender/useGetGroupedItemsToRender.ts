import { useCallback, useEffect, useReducer } from 'react';

import { AllFoundItems } from '@/components/core/application-search/components/SearchResultsSection/types';

import { State, Action } from './types';

import { getInitialState } from './utils/getInitialState';

function reducer(state: State, action: Action) {
  if (action.type === 'setInitialState') {
    return action.payload;
  }

  if (action.type === 'setShowAll') {
    const { groupName, showAll } = action.payload;

    return {
      ...state,
      [groupName]: {
        ...state[groupName],
        showAll,
      },
    };
  }

  return state;
}

export function useGetGroupedItemsToRender(items: AllFoundItems) {
  const [state, dispatch] = useReducer(reducer, {});

  useEffect(() => {
    const payload = getInitialState(items);

    dispatch({
      type: 'setInitialState',
      payload,
    });
  }, [items]);

  const showAll = useCallback(
    (groupName: string) => {
      dispatch({
        type: 'setShowAll',
        payload: { groupName, showAll: true },
      });
    },
    [dispatch],
  );

  return {
    state,
    showAll,
  };
}
