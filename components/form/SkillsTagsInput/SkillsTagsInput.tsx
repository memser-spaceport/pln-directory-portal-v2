'use client';

import { useMemo, useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import clsx from 'clsx';
import { uniq } from 'lodash';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import s from '@/components/form/FormTagsInput/FormTagsInput.module.scss';

import t from './SkillsTagsInput.module.scss';

interface SkillsTagsInputProps {
  name: string;
  selectLabel: string;
  placeholder?: string;
  suggestions?: string[];
}

export function SkillsTagsInput({
  name,
  selectLabel,
  placeholder = 'Add keyword',
  suggestions = [],
}: SkillsTagsInputProps) {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const {
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();
  const val = (getValues()[name] as string[]) ?? [];
  const { onMemberCustomSkillAdded } = useMemberAnalytics();

  const selectedLower = useMemo(() => new Set(val.map((item) => item.toLowerCase())), [val]);

  const trimmedInput = inputText.trim();
  const trimmedInputLower = trimmedInput.toLowerCase();

  const filteredSuggestions = useMemo(() => {
    if (suggestions.length === 0) return [];

    return suggestions
      .filter((item) => {
        if (selectedLower.has(item.toLowerCase())) return false;
        if (!trimmedInputLower) return true;
        return item.toLowerCase().includes(trimmedInputLower);
      })
      .sort((a, b) => a.localeCompare(b));
  }, [selectedLower, suggestions, trimmedInputLower]);

  const canAddCustom =
    trimmedInput.length > 0 &&
    !selectedLower.has(trimmedInputLower) &&
    !suggestions.some((item) => item.toLowerCase() === trimmedInputLower);

  const resolveTitle = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return '';
    const match = suggestions.find((item) => item.toLowerCase() === trimmed.toLowerCase());
    return match ?? trimmed;
  };

  const commitTitles = (text: string) => {
    const parsed = text
      .trim()
      .split(',')
      .map((item) => resolveTitle(item))
      .filter(Boolean);

    if (parsed.length === 0) return;

    const next = [...val];
    const nextLower = new Set(val.map((item) => item.toLowerCase()));
    for (const title of parsed) {
      const key = title.toLowerCase();
      if (nextLower.has(key)) continue;
      nextLower.add(key);
      next.push(title);
      if (suggestions.length > 0 && !suggestions.some((item) => item.toLowerCase() === key)) {
        onMemberCustomSkillAdded();
      }
    }

    setValue(name, next, { shouldValidate: true, shouldDirty: true });
    setInputText('');
  };

  const commitSuggestion = (title: string) => {
    if (selectedLower.has(title.toLowerCase())) return;
    setValue(name, uniq([...val, title]), { shouldValidate: true, shouldDirty: true });
    setInputText('');
  };

  return (
    <div className={s.Content}>
      <div className={s.inputLabel}>{selectLabel}</div>
      <div
        className={t.fieldWrap}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          const next = event.relatedTarget as Node | null;
          if (next && event.currentTarget.contains(next)) return;
          setIsFocused(false);
        }}
      >
        <div className={clsx(s.input, { [s.error]: errors[name] })}>
          <div className={s.inputContent}>
            {val.map((item) => (
              <div key={item} className={clsx(s.badge, t.badge)}>
                <span title={item}>{item}</span>{' '}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() =>
                    setValue(
                      name,
                      val.filter((i) => i !== item),
                      { shouldValidate: true, shouldDirty: true },
                    )
                  }
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
            ))}
            <Field.Control
              placeholder={val.length > 0 ? '' : placeholder}
              className={clsx(s.textInput, { [s.hidePlaceholder]: val.length > 0 })}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onBlur={() => {
                if (inputText.trim() === '') return;
                commitTitles(inputText);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setInputText('');
                  return;
                }

                if (event.key === 'Backspace' && inputText === '' && val.length > 0) {
                  setValue(name, val.slice(0, -1), { shouldValidate: true, shouldDirty: true });
                  return;
                }

                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitTitles(inputText);
                }
              }}
            />
          </div>
          {inputText.trim() !== '' && (
            <button type="button" className={s.addButton} onClick={() => commitTitles(inputText)}>
              <PlusIcon />
            </button>
          )}
        </div>
        {isFocused && (canAddCustom || filteredSuggestions.length > 0) && (
          <ul className={t.suggestions} role="listbox">
            {canAddCustom && (
              <li>
                <button
                  type="button"
                  className={clsx(t.suggestionItem, t.suggestionItemCustom)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitTitles(trimmedInput)}
                >
                  Add &ldquo;{trimmedInput}&rdquo;
                </button>
              </li>
            )}
            {filteredSuggestions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={t.suggestionItem}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitSuggestion(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.25 8C14.25 8.19891 14.171 8.38968 14.0303 8.53033C13.8897 8.67098 13.6989 8.75 13.5 8.75H8.75V13.5C8.75 13.6989 8.67098 13.8897 8.53033 14.0303C8.38968 14.171 8.19891 14.25 8 14.25C7.80109 14.25 7.61032 14.171 7.46967 14.0303C7.32902 13.8897 7.25 13.6989 7.25 13.5V8.75H2.5C2.30109 8.75 2.11032 8.67098 1.96967 8.53033C1.82902 8.38968 1.75 8.19891 1.75 8C1.75 7.80109 1.82902 7.61032 1.96967 7.46967C2.11032 7.32902 2.30109 7.25 2.5 7.25H7.25V2.5C7.25 2.30109 7.32902 2.11032 7.46967 1.96967C7.61032 1.82902 7.80109 1.75 8 1.75C8.19891 1.75 8.38968 1.82902 8.53033 1.96967C8.67098 2.11032 8.75 2.30109 8.75 2.5V7.25H13.5C13.6989 7.25 13.8897 7.32902 14.0303 7.46967C14.171 7.61032 14.25 7.80109 14.25 8Z"
      fill="#8897AE"
    />
  </svg>
);
