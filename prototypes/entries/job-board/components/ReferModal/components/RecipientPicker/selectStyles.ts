import { GroupBase, StylesConfig } from 'react-select';

import { RecipientOption } from '../../types';

/**
 * react-select's own control styling in this app lives as a `styles` object per
 * component; there's no shared token to import. Transcribed verbatim from
 * FormMultiSelect so the control and menu render identically — the option row's
 * two-line layout and the value *list* are the two deliberate departures (see the
 * SCSS module, and `valueContainer` / `multiValue` below).
 */
export const selectStyles: StylesConfig<RecipientOption, true, GroupBase<RecipientOption>> = {
  container: (base) => ({ ...base, width: '100%' }),
  control: (base) => ({
    ...base,
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
    // Matches the referee FormSelect above, which measures 52px because it forces a
    // 42px inner input. This is a floor, not a fixed height — the control grows with
    // the recipient list until the value container's own cap takes over.
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
  }),
  /**
   * **The field's value is a list, not a wrap of chips.** The value's job here is
   * to be read, not to be compact. A name-only chip can't answer "should Priya be
   * on this?"; a row with the role on it can.
   *
   * It is also what the field was already doing badly: at this card's width a chip
   * carrying `name + role` runs ~276px against ~502px of usable field, so every
   * chip takes a line of its own anyway. Drawing them as pills only made the list
   * ragged and put the ✕ in a different place on every line.
   *
   * The field was ~422px wide when that was measured, and the card has since gone
   * 480 → 560. Two chips still don't fit on a line (2 × 276 = 552 > 502), so the
   * argument holds — but with 50px of margin rather than 150, and a third widening
   * would end it. The numbers are here so the next person can check rather than
   * assume.
   *
   * The column layout is applied *only* when there's a value, because react-select
   * switches this box to `display: grid` when empty in order to overlap the
   * placeholder onto the input (`valueContainerCSS`, v5.10). Overriding that
   * unconditionally stacks the placeholder above the input on two lines.
   *
   * The cap and the overflow have to sit on this box, not the control: with
   * maxHeight on the control instead, nothing clips — rows paint straight through
   * the border and over the field below.
   */
  valueContainer: (base, state) => ({
    ...base,
    padding: '6px',
    // ~5 rows plus the typing line. Past that the list scrolls in place rather than
    // growing the card, so adding people never moves the footer.
    maxHeight: '200px',
    overflowY: 'auto',
    ...(state.hasValue && state.selectProps.controlShouldRenderValue
      ? {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          flexWrap: 'nowrap',
          gap: '2px',
        }
      : {}),
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
  // The pill is gone with the chip: a stack of full-width bordered capsules is a
  // list wearing four borders it doesn't need. What's left is a menu row's
  // geometry — 8px radius, the same `rgba(27, 56, 96, 0.08)` tint the options use
  // — because that is exactly what these are: the row you picked, still readable.
  multiValue: (base) => ({
    ...base,
    marginBlock: 0,
    marginInline: 0,
    display: 'flex',
    padding: '4px',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
    // The whole row is a link to the member's profile, so it answers to the hover.
    '&:hover': { background: 'rgba(27, 56, 96, 0.04)' },
  }),
  // Weight 500, not FormMultiSelect's 300: this is a *person*, and the one place
  // production names one in a picker (MemberMultiSelect's `.tagLabel`) sets names
  // at 500. Tone and the second line live on `.rowName` / `.rowRole` in the SCSS.
  // `flex: 1` is what pushes the remove control to the row's right edge, so every
  // ✕ in the list sits on one axis instead of at a ragged chip's end.
  multiValueLabel: (base) => ({
    ...base,
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    fontSize: '14px',
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
    flexShrink: 0,
    padding: 0,
    cursor: 'pointer',
    '&:hover': { background: 'transparent' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: () => ({ display: 'none' }),
  // (`indicatorsContainer` no longer needs pinning: the field is not clearable —
  // see the note on `isClearable` in RecipientPicker. A clear-all ✕ would land in
  // this column ~20px from the first row's own ✕, two marks on one edge meaning
  // "drop Anneke" and "drop everyone".)
  // Neutralised — the NoOptionsMessage override supplies production's own container.
  noOptionsMessage: (base) => ({ ...base, padding: 0, textAlign: 'left', color: 'inherit' }),
};
