'use client';

import React, { useEffect, useState } from 'react';
import Select from 'react-select';

import s from './ForumHeader.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForumAnalytics } from '@/analytics/forum.analytics';

const sortOptions = [
  {
    value: 'recently_replied',
    label: 'Recently replied',
  },
  {
    value: 'recently_created',
    label: 'Recently created',
  },
  {
    value: 'most_posts',
    label: 'Most comments',
  },
  {
    value: 'most_votes',
    label: 'Most likes',
  },
  {
    value: 'most_views',
    label: 'Most views',
  },
];

export const ForumHeader = () => {
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = sortOptions.find((option) => option.value === searchParams.get('categoryTopicSort')) || sortOptions[0];
  const selectedCategory = searchParams.get('cid');
  const analytics = useForumAnalytics();

  const onValueChange = (_value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    analytics.onForumSortSelected({ sortBy: _value });
    params.set('categoryTopicSort', _value); // or use `params.delete(key)` to remove
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setMenuPortalTarget(document.body);
    }
  }, []);

  return (
    <div className={s.root}>
      <h1>Forum</h1>
      <div className={s.inline}>
        <span>Sort by:</span>
        <Select
          menuPortalTarget={menuPortalTarget}
          menuPlacement="auto"
          options={sortOptions}
          value={value}
          defaultValue={value}
          isDisabled={selectedCategory === '0'}
          onChange={(val) => {
            if (val) {
              onValueChange(val.value);
            }
          }}
          styles={{
            container: (base) => ({
              ...base,
              width: '100%',
              position: 'relative',
              zIndex: 6,
            }),
            control: (baseStyles) => ({
              ...baseStyles,
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'stretch',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.50)',
              background: '#fff',
              outline: 'none',
              minWidth: '140px',
              width: '100%',
              borderColor: 'rgba(203, 213, 225, 0.50) !important',
              position: 'relative',
              fontSize: '16px',
              color: '#455468',
              boxShadow: 'none !important',
              '&:hover': {
                border: '1px solid #5E718D',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                borderColor: '#5E718D !important',
              },
              '&:focus-visible, &:focus': {
                borderColor: '#5E718D !important',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
              },
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              padding: 0,
              fontSize: 16,
            }),
            option: (baseStyles) => ({
              ...baseStyles,
              fontSize: '14px',
              fontWeight: 300,
              color: '#455468',
              '&:hover': {
                background: 'rgba(27, 56, 96, 0.12)',
              },
            }),

            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 50,
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              color: '#CBD5E1',
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
        />
      </div>
    </div>
  );
};
