import React, { useMemo } from 'react';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { CollapsibleSection } from '@/components/core/application-search/components/CollapsableSection';

import s from './FullSearchResults.module.scss';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';
import { SearchResult } from '@/services/search/types';

interface Props {
  searchTerm: string;
  onTryAiSearch: () => void;
}

export const FullSearchResults = ({ searchTerm, onTryAiSearch }: Props) => {
  const { data, isLoading } = useFullApplicationSearch(searchTerm);

  const sortedData = useMemo(() => {
    if (!data) {
      return [];
    }

    const sortedByKey = Object.keys(data)
      .map((key) => {
        return {
          key,
          length: data[key as keyof SearchResult]?.length ?? 0,
        };
      })
      .sort((a, b) => {
        if (a.key === 'top') {
          return -1;
        }

        if (a.length > b.length) {
          return -1;
        }

        if (a.length < b.length) {
          return 1;
        }

        return 0;
      });

    return sortedByKey
      .map((item) => {
        const values = data[item.key as keyof SearchResult];
        return {
          label: item.key === 'top' ? 'Top Results' : item.key,
          disabled: !values?.length,
          values,
        };
      })
      .filter(Boolean);
  }, [data]);

  return (
    <div className={s.root}>
      <TryAiSearch onClick={onTryAiSearch} />
      {isLoading ? (
        <ContentLoader />
      ) : (
        <>
          {sortedData.map((item) => (
            <CollapsibleSection
              key={item.label}
              title={`${item.label} (${item.values?.length ?? 0})`}
              disabled={!item.values?.length}
              initialOpen={item.label === 'Top Results' && !!item.values?.length}
            >
              <SearchResultsSection items={item.values ?? []} query={searchTerm} />
            </CollapsibleSection>
          ))}
        </>
      )}
    </div>
  );
};
