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

import { MailIcon, PlusIcon } from '../../../../icons';

import { MemberAvatar } from '../MemberAvatar';
import { RecipientInput } from './components/RecipientInput';

import { selectStyles } from './selectStyles';
import s from './RecipientPicker.module.scss';

interface RecipientPickerProps {
  label: string;
  /** Members of the hiring team — the group the menu opens on, before anything is typed. */
  teamMembers: DirectoryMember[];
  /** The hiring team itself as a pickable row: the first thing in the resting menu and
   *  the first suggestion chip, for a referrer who recognises none of the names under
   *  it. Built by `toTeamRecipientOption`, which is where the reasoning lives. */
  teamOption?: RecipientOption | null;
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
 * **The value is a list of rows, not a wrap of chips.** A name-only chip can't
 * answer "should Priya be on this?" — the role can, and it was already on the
 * menu row they picked from. `selectStyles.valueContainer` / `.multiValue` carry
 * the layout; `.row*` in the SCSS carries the contents.
 */
export function RecipientPicker(props: RecipientPickerProps) {
  const {
    label,
    teamMembers,
    teamOption,
    isTeamLoading,
    teamName,
    excludeUids,
    value,
    onChange,
    menuPortalTarget,
    description,
  } = props;

  const [query, setQuery] = useState('');
  const { results, isSearching, hasQuery, isUnauthorized } = useMemberSearch(query);

  const teamUids = useMemo(() => new Set(teamMembers.map((member) => member.uid)), [teamMembers]);

  // The hiring team with the referee and anyone already added dropped, leads first —
  // with nobody preselected, this list *is* the suggestion, and the leads are who a
  // referral is usually addressed to (see `useTeamMembers`). Stable sort, so within
  // leads and non-leads the directory's own order holds. Feeds both offers: the
  // resting menu (all of it) and the quick-add chips under the field (the first few).
  const restingTeam = useMemo<DirectoryMember[]>(() => {
    const excluded = new Set([...(excludeUids ?? []), ...value.map((option) => option.value)]);
    return teamMembers
      .filter((member) => !excluded.has(member.uid))
      .sort((a, b) => Number(b.isTeamLead ?? false) - Number(a.isTeamLead ?? false));
  }, [teamMembers, excludeUids, value]);

  const groups = useMemo<GroupBase<RecipientOption>[]>(() => {
    const excluded = new Set([...(excludeUids ?? []), ...value.map((option) => option.value)]);
    const pickable = (members: DirectoryMember[]) => members.filter((member) => !excluded.has(member.uid));

    // Nothing typed: the hiring team is the whole menu. Searching swaps in what the
    // directory matched, in the directory's ranking, split so the hiring team still
    // reads first.
    const team = hasQuery ? pickable(results.filter((member) => teamUids.has(member.uid))) : restingTeam;
    const network = hasQuery ? pickable(results.filter((member) => !teamUids.has(member.uid))) : [];

    /* The team heads its own group — it is the same answer to "who hears about
       this", one level up from the people under it, so it belongs in that list
       rather than in a group of its own. While searching it stays only if the
       query is actually about the team: typing "pri" is looking for Priya. */
    const teamRow =
      teamOption &&
      !excluded.has(teamOption.value) &&
      (!hasQuery || teamName.toLowerCase().includes(query.trim().toLowerCase()))
        ? [teamOption]
        : [];

    const result: GroupBase<RecipientOption>[] = [];
    if (team.length || teamRow.length) {
      // `omitTeam` inside this group: the heading above the rows already says
      // "Protocol Labs team", and the modal's own title says it again — a "· Protocol
      // Labs" tail on each of four rows is the same word four more times, in the
      // space the role needs.
      result.push({
        label: `${teamName} team`,
        options: [...teamRow, ...team.map((member) => toRecipientOption(member, { omitTeam: true }))],
      });
    }
    if (network.length) {
      // Wrapped, not point-free: `.map` would hand the index in as the options arg.
      result.push({ label: 'PL network', options: network.map((member) => toRecipientOption(member)) });
    }
    return result;
  }, [restingTeam, teamUids, teamName, teamOption, query, results, hasQuery, excludeUids, value]);

  /* A picked row is a snapshot, and the team row is the one row whose contents go
     on changing after it is picked: naming the candidate as the referee drops them
     from the leads it resolves to, so a team picked first would keep claiming to
     reach the very person being referred. The send already reads the live list —
     this makes the row agree with it. */
  const displayValue = useMemo(
    () => (teamOption ? value.map((option) => (option.value === teamOption.value ? teamOption : option)) : value),
    [value, teamOption],
  );

  // Four, not the whole team: the chips are a shortcut for the names the referrer
  // will recognise (the leads sort first), and a team of sixty as chips would bury
  // the field under the control meant to feed it. The rest stay one press away in
  // the same menu.
  const suggested = restingTeam.slice(0, 4);

  return (
    <div className={fieldCss.field}>
      <span className={fieldCss.label}>{label}</span>

      <CreatableSelect<RecipientOption, true, GroupBase<RecipientOption>>
        isMulti
        inputId="recipients"
        aria-label={label}
        options={groups}
        value={displayValue}
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
                  {/* The logo keeps the person's 32px circle and swaps only the
                      source — production's team fallback when the team has none of
                      its own. What says "audience" is the label and the destination
                      under it, not a different silhouette; see `.optionAvatarTeam`
                      for why the row is not the rounded square production draws a
                      team card with. */}
                  <img
                    src={
                      optionProps.data.isTeam
                        ? optionProps.data.image || '/icons/team-default-profile.svg'
                        : optionProps.data.image || getDefaultAvatar(optionProps.data.label)
                    }
                    alt=""
                    className={`${s.optionAvatar} ${optionProps.data.isTeam ? s.optionAvatarTeam : ''}`}
                  />
                  <span className={s.optionText}>
                    <span className={s.optionNameRow}>
                      <span className={s.optionName}>{optionProps.data.label}</span>
                      {optionProps.data.isTeamLead && <span className={s.leadBadge}>Lead</span>}
                    </span>
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
                  ) : data.isTeam ? (
                    <img
                      src={data.image || '/icons/team-default-profile.svg'}
                      alt=""
                      className={`${s.rowAvatar} ${s.rowAvatarTeam}`}
                    />
                  ) : (
                    <img src={data.image || getDefaultAvatar(data.label)} alt="" className={s.rowAvatar} />
                  )}
                  <span className={`${s.rowText} ${data.isTeam ? s.rowTextTeam : ''}`}>
                    <span className={s.rowName}>{data.label}</span>
                    {data.isTeamLead && <span className={s.leadBadge}>Lead</span>}
                    {/* The role — the half a name-only chip left out, and the whole
                        reason anyone can tell whether this row belongs here. Absent
                        for typed addresses, which have nothing but themselves. */}
                    {data.description && <span className={s.rowRole}>{data.description}</span>}
                  </span>
                </span>
              </components.MultiValue>
            );

            /* The team row is unlinked, like a typed address: a member row points at
               a directory page that answers "who is this?", and the team is already
               named in the modal's own title and in the group heading this row was
               picked from — there is nothing further to go and read. */
            return data.isEmail || data.isTeam ? (
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

      {/* The suggestion, made visible. The resting menu already opens on the hiring
          team, but a suggestion that only exists inside an unopened menu is not
          being made — so the first few of the same list sit under the field as
          quick-add chips, drawn to the reviewed mock: avatar, name over role, and
          a brand plus saying what a press does. The plus is the bare one from this
          entry's `icons.tsx`, not the DS `PlusIcon` — that glyph is circled, and a
          ring around a plus reads as a button in its own right, which is wrong
          inside a chip that is already one. The same mark is on the field's "Add
          someone else" line and on the outside-network menu row, so one glyph
          means "adds a recipient" everywhere on this field. Name and
          role carry the menu row's own type values (`.optionName` /
          `.optionDescription`), so the chip and the row it shortcuts read as the
          same person. One press adds the row; an added member leaves
          `restingTeam`, so their chip disappears and the next member steps up
          until the team runs out.

          **The label names the team, and has to.** It read "Suggested teammates"
          — a possessive with no owner on screen, which a reader takes as *their*
          teammates, and the referrer is usually an outsider to the hiring team.
          A bare "Suggested" fixed that but said nothing about where the names
          come from, so the scope of the offer was invisible: these are the team
          the role is tied to, not the network at large. Naming the team is the
          only thing on the card that says so at rest — the title names the role,
          not the team, and the menu's "<TEAM> TEAM" heading needs opening.

          Note this labels the *suggestions*, not the field: "Send to" itself
          accepts any network member or a typed email address, and deliberately. */}
      {(!!teamOption || suggested.length > 0) && (
        <div className={s.suggestBlock}>
          <span className={s.suggestLabel}>Suggested from {teamName}</span>

          {/* First, and ahead of the people — this is the chip for the referrer who
              recognises none of the names beside it, and a suggestion that only
              exists inside an unopened menu is not being made. It leaves the row
              the moment it is picked, like every other chip here. */}
          {!!teamOption && !value.some((option) => option.value === teamOption.value) && (
            <button
              type="button"
              className={s.suggestChip}
              aria-label={`Add ${teamOption.label}`}
              onClick={() => onChange([...value, teamOption])}
            >
              <img
                src={teamOption.image || '/icons/team-default-profile.svg'}
                alt=""
                className={`${s.suggestAvatar} ${s.suggestAvatarTeam}`}
              />
              <span className={s.suggestText}>
                <span className={s.suggestName}>{teamOption.label}</span>
                {teamOption.description && <span className={s.suggestRole}>{teamOption.description}</span>}
              </span>
              <PlusIcon width={16} height={16} className={s.suggestPlus} />
            </button>
          )}

          {suggested.map((member) => (
            <button
              key={member.uid}
              type="button"
              className={s.suggestChip}
              aria-label={`Add ${member.name}`}
              onClick={() => onChange([...value, toRecipientOption(member, { omitTeam: true })])}
            >
              <MemberAvatar name={member.name} image={member.image} size={24} className={s.suggestAvatar} />
              <span className={s.suggestText}>
                <span className={s.suggestName}>{member.name}</span>
                {member.title && <span className={s.suggestRole}>{member.title}</span>}
              </span>
              <PlusIcon width={16} height={16} className={s.suggestPlus} />
            </button>
          ))}
        </div>
      )}

      {description && <span className={s.description}>{description}</span>}
    </div>
  );
}
