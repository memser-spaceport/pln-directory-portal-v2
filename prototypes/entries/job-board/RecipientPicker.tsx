'use client';

import { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { components, type GroupBase, type StylesConfig } from 'react-select';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { CloseIcon } from '@/components/icons';

// Field wrapper + label come from the production multi-select, so this reads as the
// same field as the ones above and below it; the clear-all control borrows
// FormSelect's `.clearIndicator` so it matches the referee field directly above.
import fieldCss from '@/components/form/FormMultiSelect/FormMultiSelect.module.scss';
import selectCss from '@/components/form/FormSelect/FormSelect.module.scss';

import { MailIcon } from './icons';
import type { MockMember } from './mockMembers';
import s from './RecipientPicker.module.scss';

export interface RecipientOption {
  label: string;
  value: string;
  /** Role · team line under the name. Absent for raw email addresses. */
  description?: string;
  /** True for an address typed into the field rather than picked from the network. */
  isEmail?: boolean;
  /** Set by react-select's Creatable on the "Add ‹address›" row, before it's chosen. */
  __isNew__?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmailAddress = (value: string) => EMAIL_RE.test(value);

const toOption = (m: MockMember): RecipientOption => ({
  label: m.name,
  value: m.uid,
  description: `${m.title} · ${m.team}`,
});

/**
 * react-select's own control styling in this app lives as a `styles` object per
 * component; there's no shared token to import. Transcribed verbatim from
 * FormMultiSelect so the control, menu and chips render identically — only the
 * option row's two-line layout is new (see the SCSS module).
 */
const selectStyles: StylesConfig<RecipientOption, true, GroupBase<RecipientOption>> = {
  container: (base) => ({ ...base, width: '100%' }),
  control: (base) => ({
    ...base,
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
    '> div': { gap: '4px', padding: '6px 8px' },
  }),
  input: (base) => ({ ...base, fontSize: '14px', padding: 0, margin: 0 }),
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
  // Neutralised — the NoOptionsMessage override supplies production's own container.
  noOptionsMessage: (base) => ({ ...base, padding: 0, textAlign: 'left', color: 'inherit' }),
};

interface RecipientPickerProps {
  label: string;
  /** Members of the hiring team — listed first, under their own group heading. */
  teamMembers: MockMember[];
  /** Everyone else in the network. */
  networkMembers: MockMember[];
  teamName: string;
  value: RecipientOption[];
  onChange: (value: RecipientOption[]) => void;
  menuPortalTarget?: HTMLElement | null;
}

/**
 * One field for "who receives this" — the pattern every share/invite dialog
 * converges on (Lindy, Proton, Vercel, folk): type a name to pick someone from the
 * network, or type a full email address and the same dropdown offers to add it.
 *
 * Prototype-local because no production select can do all three things this needs:
 * `FormMultiSelect` sorts its options alphabetically (so the hiring team can't come
 * first), renders one line per option (no role), and never exposes what was typed
 * (so it can't offer "Add ‹address›"). The chrome is transcribed from it rather than
 * reinvented — see `selectStyles`.
 */
export function RecipientPicker(props: RecipientPickerProps) {
  const { label, teamMembers, networkMembers, teamName, value, onChange, menuPortalTarget } = props;

  const groups = useMemo<GroupBase<RecipientOption>[]>(() => {
    const result: GroupBase<RecipientOption>[] = [];
    if (teamMembers.length) {
      result.push({ label: `${teamName} team`, options: teamMembers.map(toOption) });
    }
    if (networkMembers.length) {
      result.push({ label: 'PL network', options: networkMembers.map(toOption) });
    }
    return result;
  }, [teamMembers, networkMembers, teamName]);

  return (
    <div className={fieldCss.field}>
      <span className={fieldCss.label}>{label}</span>

      <CreatableSelect<RecipientOption, true, GroupBase<RecipientOption>>
        isMulti
        inputId="recipients"
        aria-label={label}
        options={groups}
        value={value}
        onChange={(next) => onChange([...(next ?? [])])}
        placeholder="Type a name or email address"
        menuPlacement="auto"
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? 'fixed' : undefined}
        // Only a complete address is offerable — "ana" is a search, not a new recipient.
        isValidNewOption={(input) => isEmailAddress(input.trim().toLowerCase())}
        // `label` stays the plain address so chips and the recipient summary read it
        // as text; `__isNew__` is re-set by hand because returning a custom object
        // drops react-select's own marker — without it the Option override can't tell
        // the "add this address" row from a member and renders it as one.
        getNewOptionData={(input) =>
          ({
            label: input.trim().toLowerCase(),
            value: input.trim().toLowerCase(),
            isEmail: true,
            __isNew__: true,
          }) as RecipientOption
        }
        createOptionPosition="first"
        noOptionsMessage={() => 'No members found'}
        styles={selectStyles}
        components={{
          // Production's no-results treatment, not react-select's centred default:
          // FormSelect and FormMultiSelect both render `.notFound` — a left-aligned
          // column whose spans are 12px/400 in --Neutral-Slate-600 — with the second
          // line carrying the way out (there, "invite them"; here, the email escape).
          NoOptionsMessage: (noOptionProps) => (
            <div className={fieldCss.notFound}>
              <span>{noOptionProps.children}</span>
              <span>Type a full email address to reach someone outside the network.</span>
            </div>
          ),
          Option: (optionProps) => (
            <components.Option {...optionProps}>
              {optionProps.data.__isNew__ ? (
                <span className={s.createRow}>
                  <span className={s.mailBadge}>
                    <MailIcon />
                  </span>
                  <span className={s.createText}>
                    Add <strong>{optionProps.data.value}</strong>
                  </span>
                </span>
              ) : (
                <span className={s.optionRow}>
                  <img src={getDefaultAvatar(optionProps.data.label)} alt="" className={s.optionAvatar} />
                  <span className={s.optionText}>
                    <span className={s.optionName}>{optionProps.data.label}</span>
                    {optionProps.data.description && (
                      <span className={s.optionDescription}>{optionProps.data.description}</span>
                    )}
                  </span>
                </span>
              )}
            </components.Option>
          ),
          // Every ✕ in this field is the DS `CloseIcon` — react-select ships its own
          // bundled CrossIcon for both of these slots, and MemberMultiSelect's chips
          // use a one-off close-gray.svg asset. CloseIcon is the shared component
          // (67 files, incl. FormSelect's clear and every modal header), and it takes
          // its colour from `currentColor`, so size and tone are set in CSS.
          MultiValueRemove: (removeProps) => (
            <components.MultiValueRemove {...removeProps}>
              <span className={s.chipRemove}>
                <CloseIcon width={14} height={14} />
              </span>
            </components.MultiValueRemove>
          ),
          ClearIndicator: (clearProps) => (
            <components.ClearIndicator {...clearProps} className={selectCss.clearIndicator}>
              <CloseIcon />
            </components.ClearIndicator>
          ),
          MultiValue: (multiProps) => (
            <components.MultiValue {...multiProps}>
              <span className={s.chip}>
                {multiProps.data.isEmail ? (
                  <span className={s.chipMail}>
                    <MailIcon />
                  </span>
                ) : (
                  <img src={getDefaultAvatar(multiProps.data.label)} alt="" className={s.chipAvatar} />
                )}
                {multiProps.data.label}
              </span>
            </components.MultiValue>
          ),
          GroupHeading: (groupProps) => (
            <components.GroupHeading {...groupProps} className={s.groupHeading}>
              {groupProps.children}
            </components.GroupHeading>
          ),
        }}
      />
    </div>
  );
}
