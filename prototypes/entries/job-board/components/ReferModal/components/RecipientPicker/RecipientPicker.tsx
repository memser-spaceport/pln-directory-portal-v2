'use client';

import { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { components, type GroupBase } from 'react-select';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { CloseIcon } from '@/components/icons';

// Field wrapper + label come from the production multi-select, so this reads as the
// same field as the ones above and below it; the clear-all control borrows
// FormSelect's `.clearIndicator` so it matches the referee field directly above.
import fieldCss from '@/components/form/FormMultiSelect/FormMultiSelect.module.scss';
import selectCss from '@/components/form/FormSelect/FormSelect.module.scss';

import { RecipientOption } from '../../types';

import { isEmailAddress } from '../../utils/isEmailAddress';

import { MailIcon } from '../../../../icons';
import type { MockMember } from '../../../../mockMembers';

import { selectStyles } from './selectStyles';
import s from './RecipientPicker.module.scss';

const toOption = (m: MockMember): RecipientOption => ({
  label: m.name,
  value: m.uid,
  description: `${m.title} · ${m.team}`,
});

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
  /** Helper line under the field — see `.description` in the SCSS for which of
   *  production's two caption sizes this uses and why. */
  description?: string;
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
  const { label, teamMembers, networkMembers, teamName, value, onChange, menuPortalTarget, description } = props;

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
        // The scrollbar can only be styled from CSS, so the value container gets a
        // real class alongside the emotion styles above.
        classNames={{ valueContainer: () => s.valueContainer }}
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

      {description && <span className={s.description}>{description}</span>}
    </div>
  );
}
