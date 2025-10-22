import { useState } from 'react';

export function useFilter<T extends string>(defaultFilter: T) {
  const [activeFilter, setActiveFilter] = useState<T>(defaultFilter);

  const onFilterClick = (filter: T) => {
    setActiveFilter(filter);
  };

  return { activeFilter, onFilterClick, setActiveFilter };
}
