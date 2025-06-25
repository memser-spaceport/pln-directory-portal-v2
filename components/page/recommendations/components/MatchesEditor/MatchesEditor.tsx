'use client';

import React, { ReactNode, useState } from 'react';

import { MenuPlacement } from 'react-select';
import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';
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
}

export const MatchesEditor = ({ icon, title, hint, selectLabel, options, name, isColorfulBadges = true, menuPlacement = 'bottom' }: Props) => {
  const [open, toggleOpen] = useToggle(false);
  const [inputText, setInputText] = useState('');
  const [inputMode, toggleInputMode] = useLocalStorageParam(`matchesSelectorInputMode-${name}`, false);
  const { setValue, getValues } = useFormContext();
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as string[];

  return (
    <Collapsible.Root className={s.Collapsible} open={open} onOpenChange={toggleOpen}>
      <Collapsible.Trigger className={s.Trigger}>
        <div className={s.title}>
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
                    disabled={!values.enabled}
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
                placeholder="Write new interest"
                className={clsx(s.textInput)}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                }}
                onKeyUp={(event) => {
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

const Badge = ({ label, onDelete, isColorful, disabled }: { label: string; onDelete: () => void; isColorful: boolean; disabled: boolean }) => {
  return (
    <div
      className={clsx(s.badge, {
        [s.colorful]: isColorful,
        [s.disabled]: disabled,
      })}
    >
      {label}{' '}
      <button type="button" onClick={onDelete} disabled={disabled}>
        <CloseIcon />
      </button>
    </div>
  );
};

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.85354 9.14628C9.9 9.19274 9.93684 9.24789 9.96199 9.30859C9.98713 9.36928 10.0001 9.43434 10.0001 9.50003C10.0001 9.56573 9.98713 9.63079 9.96199 9.69148C9.93684 9.75218 9.9 9.80733 9.85354 9.85378C9.80709 9.90024 9.75194 9.93709 9.69124 9.96223C9.63054 9.98737 9.56549 10.0003 9.49979 10.0003C9.43409 10.0003 9.36904 9.98737 9.30834 9.96223C9.24765 9.93709 9.1925 9.90024 9.14604 9.85378L4.99979 5.70691L0.85354 9.85378C0.759719 9.94761 0.632472 10.0003 0.49979 10.0003C0.367108 10.0003 0.23986 9.94761 0.14604 9.85378C0.0522194 9.75996 -0.000488279 9.63272 -0.000488281 9.50003C-0.000488284 9.36735 0.0522194 9.2401 0.14604 9.14628L4.29291 5.00003L0.14604 0.853784C0.0522194 0.759964 -0.000488281 0.632716 -0.000488281 0.500034C-0.000488281 0.367352 0.0522194 0.240104 0.14604 0.146284C0.23986 0.0524635 0.367108 -0.000244141 0.49979 -0.000244141C0.632472 -0.000244141 0.759719 0.0524635 0.85354 0.146284L4.99979 4.29316L9.14604 0.146284C9.23986 0.0524635 9.36711 -0.000244143 9.49979 -0.000244141C9.63247 -0.000244138 9.75972 0.0524635 9.85354 0.146284C9.94736 0.240104 10.0001 0.367352 10.0001 0.500034C10.0001 0.632716 9.94736 0.759964 9.85354 0.853784L5.70666 5.00003L9.85354 9.14628Z"
      fill="white"
    />
  </svg>
);
