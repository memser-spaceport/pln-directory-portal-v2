import type { CSSObjectWithLabel, StylesConfig } from 'react-select';
import type { Option } from '@/components/form/FormSelect/types';

const container = (base: CSSObjectWithLabel) => ({ ...base, width: '100%' });

const control = (base: CSSObjectWithLabel, state: { isFocused: boolean; menuIsOpen: boolean; hasValue: boolean }) => ({
  ...base,
  borderRadius: '8px',
  border: `1px solid ${state.hasValue ? '#1b4dff' : state.isFocused || state.menuIsOpen ? '#5E718D' : 'rgba(203, 213, 225, 0.50)'}`,
  boxShadow: state.isFocused || state.menuIsOpen ? '0 0 0 4px rgba(27, 56, 96, 0.12)' : 'none',
  background: state.hasValue ? '#eef2ff' : '#fff',
  fontSize: '14px',
  color: '#455468',
  minHeight: '40px',
  cursor: 'pointer',
  '&:hover': {
    borderColor: state.hasValue ? '#1a3fd9' : '#5E718D',
    boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12)',
  },
});

const placeholder = (base: CSSObjectWithLabel) => ({ ...base, color: '#cbd5e1', fontWeight: 300 });

const singleValue = (base: CSSObjectWithLabel) => ({ ...base, color: '#1b4dff', fontWeight: 400 });

const indicatorSeparator = () => ({ display: 'none' });

const dropdownIndicator = (base: CSSObjectWithLabel, state: { hasValue: boolean }) => ({
  ...base,
  color: state.hasValue ? '#1b4dff' : '#455468',
  padding: '0 8px',
});

const clearIndicator = (base: CSSObjectWithLabel) => ({ ...base, color: '#8897ae', padding: '0 4px' });

const option = (base: CSSObjectWithLabel, state: { isSelected: boolean }) => ({
  ...base,
  fontSize: '14px',
  fontWeight: 300,
  color: '#455468',
  background: state.isSelected ? 'rgba(27, 56, 96, 0.12)' : 'transparent',
  cursor: 'pointer',
  '&:hover': { background: 'rgba(27, 56, 96, 0.12)' },
});

const menu = (base: CSSObjectWithLabel) => ({ ...base, zIndex: 20, borderRadius: '8px', overflow: 'hidden' });

const menuPortal = (base: CSSObjectWithLabel) => ({ ...base, zIndex: 20 });

/** Matches founder guides sidebar scope dropdown (ArticlesSidebar). */
export const filterSelectStyles: StylesConfig<Option, false> = {
  container,
  control,
  valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
  placeholder,
  singleValue,
  indicatorSeparator,
  dropdownIndicator,
  clearIndicator,
  option,
  menu,
  menuPortal,
};

export const filterMultiSelectStyles: StylesConfig<Option, true> = {
  container,
  control,
  valueContainer: (base) => ({ ...base, padding: '4px 8px', gap: '4px' }),
  placeholder,
  indicatorSeparator,
  dropdownIndicator,
  clearIndicator,
  option,
  menu,
  menuPortal,
  multiValue: (base) => ({
    ...base,
    borderRadius: '6px',
    background: 'rgba(27, 56, 96, 0.08)',
    margin: 0,
  }),
  multiValueLabel: (base) => ({
    ...base,
    fontSize: '13px',
    fontWeight: 400,
    color: '#455468',
    padding: '2px 4px',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#8897ae',
    borderRadius: '0 6px 6px 0',
    '&:hover': {
      background: 'rgba(27, 56, 96, 0.12)',
      color: '#455468',
    },
  }),
};
