'use client';

import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import Select, { MenuPlacement } from 'react-select';
import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';
import clsx from 'clsx';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

import s from './MatchesEditor.module.scss';
import { Field } from '@base-ui-components/react/field';

interface Props {
  title: string;
  icon: ReactNode;
  hint: string;
  desc: string;
  options?: { value: string; label: string }[];
  name: string;
  isColorfulBadges?: boolean;
  menuPlacement?: MenuPlacement;
}

export const MatchesEditor = ({ icon, title, hint, desc, options, name, isColorfulBadges = true, menuPlacement = 'bottom' }: Props) => {
  const [inputText, setInputText] = useState('');
  const [inputMode, toggleInputMode] = useLocalStorageParam(`matchesSelectorInputMode-${name}`, false);
  const { setValue, getValues } = useFormContext();
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as string[];
  const ref = useRef(null);

  const handleClickOutside = useCallback(() => {
    toggleInputMode(false);
  }, [toggleInputMode]);

  useOnClickOutside([ref], handleClickOutside);

  return (
    <div
      className={clsx(s.root, {
        [s.disabled]: !values.enabled,
      })}
    >
      <div className={s.header}>
        <div className={s.row}>
          <div className={s.title}>
            {icon} {title}
          </div>
          <div className={s.hint}>{hint}</div>
        </div>
        <div className={s.desc}>{desc}</div>
      </div>
      {val && val.length > 0 && (
        <div className={s.selectedList}>
          {val.map((item: string) => {
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
        </div>
      )}
      <div className={s.input} ref={ref}>
        {inputMode ? (
          <Field.Control
            placeholder="Write new interest"
            className={clsx(s.textInput)}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
            }}
            onKeyUp={(event) => {
              if (event.key === 'Enter') {
                setValue(name, [...val, inputText], { shouldValidate: true, shouldDirty: true });
                setInputText('');
              }
            }}
          />
        ) : (
          <button className={s.addButton} type="button" onClick={() => toggleInputMode(!inputMode)}>
            <PlusIcon /> Add new
          </button>
        )}
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 7C13.5 7.4375 13.1562 7.75 12.75 7.75H7.75V12.75C7.75 13.1875 7.40625 13.5312 7 13.5312C6.5625 13.5312 6.25 13.1875 6.25 12.75V7.75H1.25C0.8125 7.75 0.5 7.4375 0.5 7.03125C0.5 6.59375 0.8125 6.25 1.25 6.25H6.25V1.25C6.25 0.84375 6.5625 0.53125 7 0.53125C7.40625 0.53125 7.75 0.84375 7.75 1.25V6.25H12.75C13.1562 6.25 13.5 6.59375 13.5 7Z"
      fill="#156FF7"
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
