'use client';

import Link from 'next/link';
import isEmpty from 'lodash/isEmpty';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFloating, offset, flip, size as floatingSize, autoUpdate } from '@floating-ui/react';

import { PAGE_ROUTES } from '@/utils/constants';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';

import { ArrowDownIcon, SearchIcon } from './icons';

import s from './MemberMultiSelect.module.scss';

export type MemberOption = {
  label: string;
  value: string;
  image?: string | null;
};

interface Props {
  label: string;
  placeholder?: string;
  options: MemberOption[];
  value: MemberOption[];
  onChange: (value: MemberOption[]) => void;
}

const ITEM_HEIGHT = 48;
const MAX_VISIBLE_ITEMS = 6;

export function MemberMultiSelect(props: Props) {
  const { label, placeholder = 'Search and select members', options, value, onChange } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingSelection, setPendingSelection] = useState<MemberOption[]>([]);
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([rootRef], () => {
    if (isOpen) {
      setIsOpen(false);
      setSearch('');
    }
  });

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase();

    if (!term) {
      return options;
    }

    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, search]);

  const pendingSet = useMemo(() => new Set(pendingSelection.map((m) => m.value)), [pendingSelection]);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const openDropdown = useCallback(() => {
    setPendingSelection(value);
    setSearch('');
    setIsOpen(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  const handleSelect = useCallback(() => {
    onChange(pendingSelection);
    setIsOpen(false);
    setSearch('');
  }, [pendingSelection, onChange]);

  const toggleOption = useCallback((option: MemberOption) => {
    setPendingSelection((prev) => {
      const exists = prev.some((m) => m.value === option.value);
      if (exists) {
        return prev.filter((m) => m.value !== option.value);
      }
      return [...prev, option];
    });
  }, []);

  const removeTag = useCallback(
    (optionValue: string) => {
      onChange(value.filter((m) => m.value !== optionValue));
    },
    [value, onChange],
  );

  const listHeight = Math.min(filteredOptions.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;

  return (
    <div ref={rootRef} className={s.root}>
      <div className={s.label}>{label}</div>

      {/* Input / Tag area */}
      <div ref={refs.setReference} className={s.inputBox} onClick={openDropdown}>
        {value.length === 0 ? (
          <span className={s.placeholder}>{placeholder}</span>
        ) : (
          <div className={s.tags}>
            {value.map((member) => (
              <span key={member.value} className={s.tag}>
                <img src={member.image || getDefaultAvatar(member.label)} alt="" className={s.tagAvatar} />
                <span className={s.tagLabel}>{member.label}</span>
                <button
                  type="button"
                  className={s.tagRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(member.value);
                  }}
                >
                  <img width={12} src="/icons/close-gray.svg" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ArrowDownIcon className={s.caret} style={{ transform: isOpen ? 'rotate(180deg)' : undefined }} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div ref={refs.setFloating} style={floatingStyles} className={s.dropdown}>
          {/* Search */}
          <div className={s.searchRow}>
            <SearchIcon className={s.searchIcon} />
            <input
              autoFocus
              className={s.searchInput}
              placeholder="Search Anything"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Virtualized list */}
          <div ref={scrollParentRef} className={s.listContainer} style={{ height: listHeight || ITEM_HEIGHT }}>
            {isEmpty(filteredOptions) ? (
              <div className={s.emptyList}>No members found</div>
            ) : (
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const option = filteredOptions[virtualItem.index];
                  const isChecked = pendingSet.has(option.value);

                  return (
                    <div
                      key={option.value}
                      className={s.optionRow}
                      style={{
                        height: virtualItem.size,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      onClick={() => toggleOption(option)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleOption(option)}
                        classes={{
                          root: s.checkbox,
                        }}
                      />
                      <img src={option.image || getDefaultAvatar(option.label)} alt="" className={s.optionAvatar} />
                      <span className={s.optionLabel}>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={s.footer}>
            <div className={s.footerButtons}>
              <Button size="s" style="border" onClick={handleCancel} className={s.footerBtn}>
                Cancel
              </Button>
              <Button
                size="s"
                onClick={handleSelect}
                className={s.footerBtn}
                disabled={isEmpty(filteredOptions) && isEmpty(pendingSelection)}
              >
                Select
              </Button>
            </div>
            <div className={s.footerHint}>
              User not listed here?{' '}
              <Link href={PAGE_ROUTES.SIGNUP} className={s.footerLink} target="_blank">
                Invite them first
              </Link>{' '}
              to add them to your team
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
