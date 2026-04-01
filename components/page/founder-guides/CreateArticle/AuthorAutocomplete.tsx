'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useAuthorSearch } from '@/services/search/hooks/useAuthorSearch';
import { useMember } from '@/services/members/hooks/useMember';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { FoundItem } from '@/services/search/types';
import s from './AuthorAutocomplete.module.scss';

type AuthorValue = { label: string; value: string; type: 'member' | 'team' } | null;

export function AuthorAutocomplete() {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const selected: AuthorValue = watch('author');

  const { userInfo } = getCookiesFromClient();
  const isAdmin = isAdminUser(userInfo);

  const { data: memberData } = useMember(isAdmin ? undefined : userInfo?.uid);
  const userTeamUids = useMemo(() => {
    if (isAdmin) return [];
    if (memberData?.memberInfo?.teamMemberRoles) {
      return memberData.memberInfo.teamMemberRoles.map((tm: { teamUid: string }) => tm.teamUid);
    }
    return userInfo?.leadingTeams ?? [];
  }, [isAdmin, memberData, userInfo?.leadingTeams]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isPending } = useAuthorSearch(debouncedTerm);

  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    if (isAdmin) return data.members;
    return data.members.filter((m) => m.uid === userInfo?.uid);
  }, [data?.members, isAdmin, userInfo?.uid]);

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return [];
    if (isAdmin) return data.teams;
    return data.teams.filter((t) => userTeamUids.includes(t.uid));
  }, [data?.teams, isAdmin, userTeamUids]);

  const allOptions = useMemo(() => {
    const items: (FoundItem & { authorType: 'member' | 'team' })[] = [];
    filteredMembers.forEach((m) => items.push({ ...m, authorType: 'member' }));
    filteredTeams.forEach((t) => items.push({ ...t, authorType: 'team' }));
    return items;
  }, [filteredMembers, filteredTeams]);

  const handleSelect = useCallback(
    (item: FoundItem, type: 'member' | 'team') => {
      const val: AuthorValue = { label: item.name, value: item.uid, type };
      setValue('author', val, { shouldValidate: true, shouldDirty: true });
      setSearchTerm('');
      setDebouncedTerm('');
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [setValue],
  );

  const handleClear = useCallback(() => {
    setValue('author', null, { shouldValidate: true, shouldDirty: true });
    setSearchTerm('');
    setDebouncedTerm('');
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }, [setValue]);

  useOnClickOutside([containerRef], () => {
    setIsOpen(false);
    setHighlightIndex(-1);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < allOptions.length) {
        const item = allOptions[highlightIndex];
        handleSelect(item, item.authorType);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const showDropdown = isOpen && !selected;
  const isSearching = debouncedTerm.length >= 2;
  const hasResults = filteredMembers.length > 0 || filteredTeams.length > 0;

  let flatIndex = 0;

  return (
    <div className={s.field}>
      <label className={s.label}>Select Member or Team</label>
      <div className={s.inputWrapper} ref={containerRef}>
        <input
          ref={inputRef}
          className={s.input}
          placeholder="Search by name"
          value={selected ? selected.label : searchTerm}
          readOnly={!!selected}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => {
            if (!selected) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {selected && (
          <button type="button" className={s.clearBtn} onClick={handleClear} aria-label="Clear author">
            &times;
          </button>
        )}

        {showDropdown && (
          <div className={s.dropdown}>
            {!isSearching && <div className={s.hint}>Type at least 2 characters to search</div>}

            {isSearching && isPending && <div className={s.hint}>Searching...</div>}

            {isSearching && !isPending && !hasResults && <div className={s.hint}>No results found</div>}

            {isSearching && !isPending && filteredMembers.length > 0 && (
              <>
                <div className={s.groupHeader}>
                  <img src="/icons/members.svg" alt="" className={s.groupIcon} />
                  Members
                </div>
                {filteredMembers.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <div
                      key={`member-${item.uid}`}
                      className={clsx(s.option, idx === highlightIndex && s.highlighted)}
                      onClick={() => handleSelect(item, 'member')}
                      onMouseEnter={() => setHighlightIndex(idx)}
                    >
                      <img src={item.image || getDefaultAvatar(item.name)} alt="" className={s.optionImage} />
                      <span className={s.optionName}>{item.name}</span>
                      <img src="/icons/members.svg" alt="Member" className={s.typeIcon} />
                    </div>
                  );
                })}
              </>
            )}

            {isSearching && !isPending && filteredTeams.length > 0 && (
              <>
                <div className={s.groupHeader}>
                  <img src="/icons/teams.svg" alt="" className={s.groupIcon} />
                  Teams
                </div>
                {filteredTeams.map((item) => {
                  const idx = flatIndex++;
                  return (
                    <div
                      key={`team-${item.uid}`}
                      className={clsx(s.option, idx === highlightIndex && s.highlighted)}
                      onClick={() => handleSelect(item, 'team')}
                      onMouseEnter={() => setHighlightIndex(idx)}
                    >
                      <img src={item.image || getDefaultAvatar(item.name)} alt="" className={s.optionImage} />
                      <span className={s.optionName}>{item.name}</span>
                      <img src="/icons/teams.svg" alt="Team" className={s.typeIcon} />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
      {errors.author && <span className={s.error}>{errors.author.message as string}</span>}
    </div>
  );
}
