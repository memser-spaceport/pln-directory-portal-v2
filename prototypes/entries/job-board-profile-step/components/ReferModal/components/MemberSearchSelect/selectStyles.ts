import { StylesConfig } from 'react-select';

import { Option } from '@/components/form/FormSelect/types';

/**
 * Transcribed verbatim from `FormSelect`'s own `styles` object — that app-wide control
 * styling lives inline per component, with no shared token to import, so the only way
 * for this field to measure like the production one is to copy it.
 *
 * Dropped: FormSelect's `errors[name]` branch on the control's border. This form runs
 * no validation, so the error border can never apply.
 */
export const selectStyles: StylesConfig<Option, false> = {
  container: (base) => ({
    ...base,
    width: '100%',
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
    height: '42px',
    padding: 0,
    fontSize: 16,
  }),
  option: (baseStyles) => ({
    ...baseStyles,
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '-0.2px',
    color: '#455468',
    '&:hover': {
      background: 'rgba(27, 56, 96, 0.12)',
    },
  }),
  menuList: (base) => ({
    ...base,
    width: '100%',
    padding: 0,
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    outline: 'none',
    zIndex: 3,
    display: 'flex',
    padding: '8px',
    flexDirection: 'column',
    alignItems: 'flex-start',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: '#CBD5E1',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
};
