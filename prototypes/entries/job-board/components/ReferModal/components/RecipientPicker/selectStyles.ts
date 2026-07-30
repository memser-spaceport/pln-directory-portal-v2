import { GroupBase, StylesConfig } from 'react-select';

import { RecipientOption } from '../../types';

/**
 * react-select's own control styling in this app lives as a `styles` object per
 * component; there's no shared token to import. Transcribed verbatim from
 * FormMultiSelect so the control, menu and chips render identically — only the
 * option row's two-line layout is new (see the SCSS module).
 */
export const selectStyles: StylesConfig<RecipientOption, true, GroupBase<RecipientOption>> = {
  container: (base) => ({ ...base, width: '100%' }),
  control: (base, state) => ({
    ...base,
    // The typing area only needs room to type in while you're actually typing. At
    // rest it collapses so it sits inline after the last chip; focused, it claims a
    // usable width and wraps onto its own line if the chips leave no space.
    '--recipient-input-floor': state.isFocused ? '60px' : '2px',
    // Grow is what actually claims the row: react-select's input container is
    // flex-grow 1, so even collapsed to 2px it stretches to fill a line of its own.
    '--recipient-input-grow': state.isFocused ? 1 : 0,
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
    // Matches the referee FormSelect above, which measures 52px because it forces a
    // 42px inner input. A chip row alone comes to 46px, so this is a floor, not a
    // fixed height — the control still grows as chips wrap.
    minHeight: '52px',
    borderRadius: '8px',
    border: '1px solid rgba(203, 213, 225, 0.50)',
    background: '#fff',
    outline: 'none',
    fontSize: '14px',
    minWidth: '140px',
    width: '100%',
    borderColor: 'rgba(203, 213, 225, 0.50) !important',
    position: 'relative',
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
    // The cap and the overflow have to sit on the same box — the value container.
    // With maxHeight on the control instead, nothing clips: chips paint straight
    // through the border and over the field below.
    '> div': {
      gap: '4px',
      padding: '6px 8px',
      // Three 30px rows + two 4px gaps + the 12px vertical padding. Two rows of
      // chips and the typing line all fit, so the common case never scrolls — at
      // two rows the input wrapped onto a hidden third row and typing scrolled
      // the field out from under you.
      maxHeight: '110px',
      overflowY: 'auto',
      alignContent: 'flex-start',
      // Keeps chips clear of the scrollbar track when one appears.
      paddingRight: '4px',
    },
  }),
  // The typing area is allowed to shrink to nothing by default, so a long address
  // typed next to a chip gets squeezed under it and paints over the chip. Giving it
  // a floor makes it wrap onto its own line instead, and hiding overflow stops any
  // text escaping the box it was measured for.
  input: (base) => ({
    ...base,
    fontSize: '14px',
    padding: 0,
    margin: 0,
    flexGrow: 'var(--recipient-input-grow, 0)',
    flexShrink: 1,
    flexBasis: 'auto',
    // Set by the control above: 2px at rest, 60px focused. A fixed 140px floor
    // wrapped this onto a line of its own almost every time, which read as
    // unexplained empty space under the chips. `overflow: hidden` is what actually
    // prevents text painting over a chip, so the floor is free to collapse.
    minWidth: 'var(--recipient-input-floor, 2px)',
    maxWidth: '100%',
    overflow: 'hidden',
  }),
  placeholder: (base) => ({ ...base, color: '#AFBACA', fontSize: '14px' }),
  menu: (base) => ({ ...base, outline: 'none', zIndex: 3, overflow: 'hidden' }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  option: (base, state) => ({
    ...base,
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: state.isFocused ? 'rgba(27, 56, 96, 0.08)' : 'transparent',
    '&:active': { backgroundColor: 'rgba(27, 56, 96, 0.12)' },
  }),
  group: (base) => ({ ...base, paddingTop: 0, paddingBottom: '4px' }),
  multiValue: (base) => ({
    ...base,
    marginBlock: 0,
    display: 'flex',
    padding: '4px 6px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2px',
    borderRadius: 'var(--corner-radius-sm, 6px)',
    border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
    background: 'var(--background-base-white, #FFF)',
    boxShadow: '0px 1px 2px 0px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
  }),
  // Weight 500, not FormMultiSelect's 300: this is a *person* chip, and the one
  // production has (MemberMultiSelect's `.tagLabel`) sets names at 500/#455468.
  // Padding lives on `.chip` instead, so the avatar / mail glyph, the name and the
  // remove control all sit on one centred row with even spacing between them.
  multiValueLabel: (base) => ({
    ...base,
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#455468',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '-0.2px',
    padding: 0,
  }),
  multiValueRemove: (base) => ({
    ...base,
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 0,
    cursor: 'pointer',
    '&:hover': { background: 'transparent' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: () => ({ display: 'none' }),
  // Pinned to the top rather than the control's vertical centre: once the field
  // holds several rows of chips, a centred clear-all floats in the middle of the
  // list with nothing to relate to. 9px lines it up with the first chip row —
  // 6px container padding plus half the 30px row's overhang on the 24px control.
  indicatorsContainer: (base) => ({ ...base, alignSelf: 'flex-start', paddingTop: '9px' }),
  // Neutralised — the NoOptionsMessage override supplies production's own container.
  noOptionsMessage: (base) => ({ ...base, padding: 0, textAlign: 'left', color: 'inherit' }),
};
