'use client';

import { CloseIcon, SearchIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';

import s from './SearchInput.module.scss';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search', className }: SearchInputProps) {
  return (
    <DebouncedInput
      value={value}
      ids={{ root: '', input: '' }}
      classes={{
        root: `${s.root}${className ? ` ${className}` : ''}`,
        input: s.input,
        flushBtn: s.flushBtn,
        clearBtn: s.clearBtn,
      }}
      onChange={onChange}
      placeholder={placeholder}
      hideFlushIconOnValueInput
      clearIcon={<CloseIcon color="#64748b" />}
      flushIcon={<SearchIcon color="#64748b" className={s.searchIcon} />}
    />
  );
}
