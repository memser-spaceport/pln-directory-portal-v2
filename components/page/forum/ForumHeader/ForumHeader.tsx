'use client';

import React from 'react';
import Select from 'react-select';

import s from './ForumHeader.module.scss';

const sortOptions = [
  {
    value: 'newest',
    label: 'Newest',
  },
  {
    value: 'oldest',
    label: 'Oldest',
  },
];

export const ForumHeader = () => {
  const [value, setValue] = React.useState({
    value: 'newest',
    label: 'Newest',
  });

  return (
    <div className={s.root}>
      <h1>Forum</h1>
      <div className={s.inline}>
        <span>Sort by:</span>
        <Select
          menuPortalTarget={document.body}
          menuPlacement="auto"
          options={sortOptions}
          value={value}
          defaultValue={value}
          onChange={(val) => {
            if (val) {
              setValue(val);
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
