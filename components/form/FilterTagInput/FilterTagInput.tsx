import React, { useState, useCallback, useEffect } from 'react';
import { Field } from '@base-ui-components/react/field';
import clsx from 'clsx';
import { uniq } from 'lodash';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

import s from './FilterTagInput.module.scss';

interface Props {
  options?: { value: string; label: string }[];
  paramKey: string;
  isColorfulBadges?: boolean;
  selectLabel: string;
  warning?: boolean;
  placeholder?: string;
  disabled?: boolean;
  isRequired?: boolean;
  params?: URLSearchParams;
  setParam?: (key: string, value?: string) => void;
}

export const FilterTagInput = ({
  selectLabel,
  paramKey,
  isColorfulBadges = true,
  placeholder = 'Add keyword',
  disabled = false,
  isRequired = false,
  warning = false,
  params: externalParams,
  setParam: externalSetParam,
}: Props) => {
  const [inputText, setInputText] = useState('');
  const membersStore = useFilterStore();

  // Use external params/setParam if provided, otherwise use members store
  const params = externalParams || membersStore.params;
  const setParam = externalSetParam || membersStore.setParam;

  // Get initial values from URL parameters
  const getInitialValues = () => {
    const paramValue = params.get(paramKey);
    if (!paramValue) return [];

    return paramValue.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean);
  };

  const [tags, setTags] = useState<string[]>(getInitialValues());

  // Track the current parameter value to detect changes
  const currentParamValue = params.get(paramKey) || '';

  // Sync local state with URL parameters when they change
  useEffect(() => {
    const currentValues = currentParamValue ? currentParamValue.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean) : [];
    setTags(currentValues);
  }, [currentParamValue]);

  // Update URL parameters when tags change
  useEffect(() => {
    if (tags.length > 0) {
      const values = tags.join(URL_QUERY_VALUE_SEPARATOR);
      setParam(paramKey, values);
    } else {
      setParam(paramKey, undefined);
    }
  }, [tags, paramKey, setParam]);

  const handleAddTag = useCallback(
    (newTag: string) => {
      if (newTag.trim() === '') {
        return;
      }

      if (tags.includes(newTag.trim())) {
        return;
      }

      const parsedInput = newTag
        .trim()
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      setTags((prev) => uniq([...prev, ...parsedInput]));
      setInputText('');
    },
    [tags],
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        setInputText('');
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTag(inputText);
      }
    },
    [inputText, handleAddTag],
  );

  const handleBlur = useCallback(() => {
    handleAddTag(inputText);
  }, [inputText, handleAddTag]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleAddButtonClick = useCallback(() => {
    handleAddTag(inputText);
  }, [inputText, handleAddTag]);

  return (
    <div className={clsx(s.Content, { [s.disabled]: disabled })}>
      <div
        className={clsx(s.inputLabel, {
          [s.required]: isRequired,
          [s.warning]: warning,
        })}
      >
        {selectLabel}
      </div>
      <div className={s.input}>
        <div className={s.inputContent}>
          {tags?.map((item: string) => {
            return (
              <Badge
                key={item}
                label={item}
                isColorful={isColorfulBadges}
                disabled={disabled}
                onDelete={() => handleRemoveTag(item)}
              />
            );
          })}
          <Field.Control
            placeholder={tags?.length > 0 ? '' : placeholder}
            className={clsx(s.textInput, {
              [s.hidePlaceholder]: tags?.length > 0,
            })}
            value={inputText}
            disabled={disabled}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </div>
        {!!inputText?.length && (
          <button type="button" className={s.addButton} disabled={disabled} onClick={handleAddButtonClick}>
            <PlusIcon />
          </button>
        )}
      </div>
    </div>
  );
};

const Badge = ({
  label,
  onDelete,
  isColorful,
  disabled,
}: {
  label: string;
  onDelete: () => void;
  isColorful: boolean;
  disabled?: boolean;
}) => {
  return (
    <div
      className={clsx(s.badge, {
        [s.colorful]: isColorful,
        [s.disabled]: disabled,
      })}
    >
      <span>{label}</span>{' '}
      <button type="button" onClick={onDelete} disabled={disabled}>
        <CloseIcon />
      </button>
    </div>
  );
};

const CloseIcon = () => (
  <svg height="14" width="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="css-tj5bde-Svg">
    <path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.25 8C14.25 8.19891 14.171 8.38968 14.0303 8.53033C13.8897 8.67098 13.6989 8.75 13.5 8.75H8.75V13.5C8.75 13.6989 8.67098 13.8897 8.53033 14.0303C8.38968 14.171 8.19891 14.25 8 14.25C7.80109 14.25 7.61032 14.171 7.46967 14.0303C7.32902 13.8897 7.25 13.6989 7.25 13.5V8.75H2.5C2.30109 8.75 2.11032 8.67098 1.96967 8.53033C1.82902 8.38968 1.75 8.19891 1.75 8C1.75 7.80109 1.82902 7.61032 1.96967 7.46967C2.11032 7.32902 2.30109 7.25 2.5 7.25H7.25V2.5C7.25 2.30109 7.32902 2.11032 7.46967 1.96967C7.61032 1.82902 7.80109 1.75 8 1.75C8.19891 1.75 8.38968 1.82902 8.53033 1.96967C8.67098 2.11032 8.75 2.30109 8.75 2.5V7.25H13.5C13.6989 7.25 13.8897 7.32902 14.0303 7.46967C14.171 7.61032 14.25 7.80109 14.25 8Z"
      fill="#8897AE"
    />
  </svg>
);
