'use client';

import React, { ReactNode, useState } from 'react';

import { MenuPlacement } from 'react-select';
import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import clsx from 'clsx';

import s from './MatchesEditor.module.scss';
import { Field } from '@base-ui-components/react/field';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { ChevronIcon } from '@/components/page/recommendations/components/MatchesSelector';
import { useToggle } from 'react-use';

interface Props {
  title: string;
  icon: ReactNode;
  hint: string;
  options?: { value: string; label: string }[];
  name: string;
  isColorfulBadges?: boolean;
  menuPlacement?: MenuPlacement;
  selectLabel: string;
  warning: boolean;
}

export const MatchesEditor = ({ icon, title, hint, selectLabel, warning, name, isColorfulBadges = true, menuPlacement = 'bottom' }: Props) => {
  const [inputText, setInputText] = useState('');
  const { setValue, getValues } = useFormContext();
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as string[];
  const isDisabled = !values.enabled;
  const [open, toggleOpen] = useToggle(val?.length > 0);

  return (
    <Collapsible.Root className={s.Collapsible} open={open} onOpenChange={toggleOpen}>
      <Collapsible.Trigger className={s.Trigger}>
        <div
          className={clsx(s.title, {
            [s.warning]: warning,
          })}
        >
          {icon} {title}
        </div>
        <ChevronIcon className={s.Icon} />
      </Collapsible.Trigger>
      <Collapsible.Panel className={s.Panel}>
        <div className={s.Content}>
          <div className={s.header}>
            <div className={s.hint}>{hint}</div>
          </div>
          <div className={s.inputLabel}>{selectLabel}</div>
          <div className={s.input}>
            <div className={s.inputContent}>
              {val?.map((item: string) => {
                return (
                  <Badge
                    key={item}
                    label={item}
                    isColorful={isColorfulBadges}
                    onDelete={() => {
                      setValue(
                        name,
                        val.filter((i) => i !== item),
                        { shouldValidate: true, shouldDirty: true },
                      );
                    }}
                  />
                );
              })}
              <Field.Control
                placeholder={val?.length > 0 ? '' : 'Add keyword'}
                className={clsx(s.textInput)}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (inputText.trim() === '') {
                      return;
                    }

                    setValue(name, [...val, inputText], { shouldValidate: true, shouldDirty: true });
                    setInputText('');
                  }
                }}
              />
            </div>
            <button
              type="button"
              className={s.addButton}
              onClick={() => {
                if (inputText.trim() === '') {
                  return;
                }

                setValue(name, [...val, inputText], { shouldValidate: true, shouldDirty: true });
                setInputText('');
              }}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.25 8C14.25 8.19891 14.171 8.38968 14.0303 8.53033C13.8897 8.67098 13.6989 8.75 13.5 8.75H8.75V13.5C8.75 13.6989 8.67098 13.8897 8.53033 14.0303C8.38968 14.171 8.19891 14.25 8 14.25C7.80109 14.25 7.61032 14.171 7.46967 14.0303C7.32902 13.8897 7.25 13.6989 7.25 13.5V8.75H2.5C2.30109 8.75 2.11032 8.67098 1.96967 8.53033C1.82902 8.38968 1.75 8.19891 1.75 8C1.75 7.80109 1.82902 7.61032 1.96967 7.46967C2.11032 7.32902 2.30109 7.25 2.5 7.25H7.25V2.5C7.25 2.30109 7.32902 2.11032 7.46967 1.96967C7.61032 1.82902 7.80109 1.75 8 1.75C8.19891 1.75 8.38968 1.82902 8.53033 1.96967C8.67098 2.11032 8.75 2.30109 8.75 2.5V7.25H13.5C13.6989 7.25 13.8897 7.32902 14.0303 7.46967C14.171 7.61032 14.25 7.80109 14.25 8Z"
      fill="#8897AE"
    />
  </svg>
);

const Badge = ({ label, onDelete, isColorful, disabled }: { label: string; onDelete: () => void; isColorful: boolean; disabled?: boolean }) => {
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
