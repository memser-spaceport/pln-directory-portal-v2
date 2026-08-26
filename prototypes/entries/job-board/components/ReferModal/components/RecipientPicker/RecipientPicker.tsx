'use client';

import { useMemo, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import { components, type GroupBase } from 'react-select';

import { PAGE_ROUTES } from '@/utils/constants';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { CloseIcon } from '@/components/icons';

// Field wrapper + label come from the production multi-select, so this reads as the
// same field as the ones above and below it.
import fieldCss from '@/components/form/FormMultiSelect/FormMultiSelect.module.scss';

import { DirectoryMember, RecipientOption } from '../../types';

import { isEmailAddress } from '../../utils/isEmailAddress';
import { toRecipientOption } from '../../utils/toRecipientOption';

import { useMemberSearch } from '../../hooks/useMemberSearch';

import { MailIcon } from '../../../../icons';

import { RecipientInput } from './components/RecipientInput';

import { selectStyles } from './selectStyles';
import s from './RecipientPicker.module.scss';

interface RecipientPickerProps {
  label: string;
  /** Members of the hiring team — the group the menu opens on, before anything is typed. */
  teamMembers: DirectoryMember[];
  /** The hiring team is still on the wire — an empty menu means "not yet", not "nobody". */
  isTeamLoading?: boolean;
  teamName: string;
  /** Members who can't be recipients: the person being referred, and anyone already added. */
  excludeUids?: string[];
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
 *
 * **The value is a list of rows, not a wrap of chips**, because this field arrives
 * pre-filled: the modal seeds it with the hiring team, so the referrer's first job
 * here is to check a set someone else assembled. A name-only chip can't answer
 * "should Priya be on this?" — the role can, and it was already on the menu row
 * they picked from. `selectStyles.valueContainer` / `.multiValue` carry the layout;
 * `.row*` in the SCSS carries the contents.
 */
export function RecipientPicker(props: RecipientPickerProps) {
  const { label, teamMembers, isTeamLoading, teamName, excludeUids, value, onChange, menuPortalTarget, description } =
    props;

  const [query, setQuery] = useState('');
  const { results, isSearching, hasQuery, isUnauthorized } = useMemberSearch(query);

  const teamUids = useMemo(() => new Set(teamMembers.map((member) => member.uid)), [teamMembers]);

  const groups = useMemo<GroupBase<RecipientOption>[]>(() => {
    const excluded = new Set([...(excludeUids ?? []), ...value.map((option) => option.value)]);
    const pickable = (members: DirectoryMember[]) => members.filter((member) => !excluded.has(member.uid));

    // Nothing typed: the hiring team is the whole menu. Searching swaps in what the
    // directory matched, split so the hiring team still reads first.
    const team = hasQuery ? pickable(results.filter((member) => teamUids.has(member.uid))) : pickable(teamMembers);
    const network = hasQuery ? pickable(results.filter((member) => !teamUids.has(member.uid))) : [];

    const result: GroupBase<RecipientOption>[] = [];
    if (team.length) {
      // `omitTeam` inside this group: the heading above the rows already says
      // "Protocol Labs team", and the modal's own title says it again — a "· Protocol
      // Labs" tail on each of four rows is the same word four more times, in the
      // space the role needs.
      result.push({
        label: `${teamName} team`,
        options: team.map((member) => toRecipientOption(member, { omitTeam: true })),
      });
    }
    if (network.length) {
      // Wrapped, not point-free: `.map` would hand the index in as the options arg.
      result.push({ label: 'PL network', options: network.map((member) => toRecipientOption(member)) });
    }
    return result;
  }, [teamMembers, teamUids, teamName, results, hasQuery, excludeUids, value]);

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
        /* No clear-all. Every row already ends in its own ✕ on the field's right
           edge, and react-select's clear control lands in the indicators column
           ~20px further along the same edge — two marks side by side, one meaning
           "drop Anneke" and the other "drop everyone", on a field that cannot be
           sent empty anyway. */
        isClearable={false}
        inputValue={query}
        // Mirrors whatever react-select reports, typing or not: it clears the input
        // after every pick, and holding on to the old text would keep the menu showing
        // the last search instead of dropping back to the hiring team.
        onInputChange={(next) => setQuery(next)}
        // The directory already ranked and capped the matches, and the group split
        // above is what orders them — filtering again would only drop rows.
        filterOption={() => true}
        isLoading={isSearching}
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
        noOptionsMessage={() => {
          if (!hasQuery && isTeamLoading) {
            return `Loading the ${teamName} team…`;
          }
          if (!hasQuery) {
            return 'Type a name to search the network';
          }
          // Searching the network needs a session; adding an email address doesn't, so
          // this field still has something to offer signed out.
          if (isUnauthorized) {
            return 'Sign in to search members';
          }
          return 'No members found';
        }}
        loadingMessage={() => 'Searching members…'}
        styles={selectStyles}
        // The scrollbar can only be styled from CSS, so the value container gets a
        // real class alongside the emotion styles above.
        classNames={{ valueContainer: () => s.valueContainer }}
        components={{
          // The list's last line: an **Add someone else** button at rest, the typing
          // line once pressed — in place of react-select's CSS-Grid auto-sizing
          // input. Must stay a stable reference (never an inline arrow like the
          // overrides below), or the <input> remounts mid-edit. See `RecipientInput`.
          Input: RecipientInput,
          // Production's no-results treatment, not react-select's centred default:
          // FormSelect and FormMultiSelect both render `.notFound` — a left-aligned
          // column whose spans are 12px/400 in --Neutral-Slate-600 — with the second
          // line carrying the way out (there, "invite them"; here, the email escape).
          NoOptionsMessage: (noOptionProps) => (
            <div className={fieldCss.notFound}>
              <span>{noOptionProps.children}</span>
              {/* The way out is only worth offering once the search has actually come
                  back empty — with nothing typed yet, nobody is missing. */}
              {hasQuery && <span>Type a full email address to reach someone outside the network.</span>}
            </div>
          ),
          // Same treatment while a request is out: react-select's default here is a
          // centred "Loading...", which would make the menu jump between states.
          LoadingMessage: (loadingProps) => (
            <div className={fieldCss.notFound}>
              <span>{loadingProps.children}</span>
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
                  <img
                    src={optionProps.data.image || getDefaultAvatar(optionProps.data.label)}
                    alt=""
                    className={s.optionAvatar}
                  />
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
          // bundled CrossIcon for this slot, and MemberMultiSelect's chips use a
          // one-off close-gray.svg asset. CloseIcon is the shared component
          // (67 files, incl. FormSelect's clear and every modal header), and it takes
          // its colour from `currentColor`, so size and tone are set in CSS.
          //
          // 16px, not the chip's old 14: it is the row's only control now, and it is
          // no longer tucked against a name — it sits alone on the right edge.
          MultiValueRemove: (removeProps) => {
            const { innerProps, data } = removeProps;

            return (
              <components.MultiValueRemove
                {...removeProps}
                innerProps={{
                  ...innerProps,
                  'aria-label': `Remove ${data.label}`,
                  // Member rows are wrapped in a profile link.
                  // Without this, removing the row also fires that navigation.
                  onClick: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    innerProps?.onClick?.(event);
                  },
                }}
              >
                <span className={s.rowRemove}>
                  <CloseIcon width={16} height={16} />
                </span>
              </components.MultiValueRemove>
            );
          },
          MultiValue: (multiProps) => {
            const { data, innerProps } = multiProps;

            const content = (
              <components.MultiValue
                {...multiProps}
                innerProps={{
                  ...innerProps,
                  // Сlicking a row to follow its profile link or hit
                  // remove reopens the picker's menu underneath it.
                  onMouseDown: (event) => {
                    event.preventDefault();
                    innerProps?.onMouseDown?.(event);
                  },
                }}
              >
                <span className={s.row}>
                  {data.isEmail ? (
                    <span className={s.rowMail}>
                      <MailIcon />
                    </span>
                  ) : (
                    <img src={data.image || getDefaultAvatar(data.label)} alt="" className={s.rowAvatar} />
                  )}
                  <span className={s.rowText}>
                    <span className={s.rowName}>{data.label}</span>
                    {/* The role — the half a name-only chip left out, and the whole
                        reason anyone can tell whether this row belongs here. Absent
                        for typed addresses, which have nothing but themselves. */}
                    {data.description && <span className={s.rowRole}>{data.description}</span>}
                  </span>
                </span>
              </components.MultiValue>
            );

            return data.isEmail ? (
              content
            ) : (
              <a target="_blank" href={`${PAGE_ROUTES.MEMBERS}/${data.value}`}>
                {content}
              </a>
            );
          },
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
