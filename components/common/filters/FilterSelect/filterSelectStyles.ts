import type { StylesConfig } from 'react-select';
import type { Option } from '@/components/form/FormSelect/types';

/** Matches founder guides sidebar scope dropdown (ArticlesSidebar). */
export const filterSelectStyles: StylesConfig<Option, false> = {
  container: (base) => ({ ...base, width: '100%' }),
  control: (base, state) => ({
    ...base,
    borderRadius: '8px',
    border: `1px solid ${state.isFocused || state.menuIsOpen ? '#5E718D' : 'rgba(203, 213, 225, 0.50)'}`,
    boxShadow: state.isFocused || state.menuIsOpen ? '0 0 0 4px rgba(27, 56, 96, 0.12)' : 'none',
    fontSize: '14px',
    color: '#455468',
    minHeight: '40px',
    cursor: 'pointer',
    '&:hover': {
      borderColor: '#5E718D',
      boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12)',
    },
  }),
  valueContainer: (base) => ({ ...base, padding: '2px 8px' }),
  placeholder: (base) => ({ ...base, color: '#cbd5e1', fontWeight: 300 }),
  singleValue: (base) => ({ ...base, color: '#455468', fontWeight: 300 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, color: '#455468', padding: '0 8px' }),
  clearIndicator: (base) => ({ ...base, color: '#8897ae', padding: '0 4px' }),
  option: (base, state) => ({
    ...base,
    fontSize: '14px',
    fontWeight: 300,
    color: '#455468',
    background: state.isSelected ? 'rgba(27, 56, 96, 0.12)' : 'transparent',
    cursor: 'pointer',
    '&:hover': { background: 'rgba(27, 56, 96, 0.12)' },
  }),
  menu: (base) => ({ ...base, zIndex: 20, borderRadius: '8px', overflow: 'hidden' }),
  menuPortal: (base) => ({ ...base, zIndex: 20 }),
};

export const filterMultiSelectStyles: StylesConfig<Option, true> = {
  ...filterSelectStyles,
  valueContainer: (base) => ({ ...base, padding: '4px 8px', gap: '4px' }),
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
