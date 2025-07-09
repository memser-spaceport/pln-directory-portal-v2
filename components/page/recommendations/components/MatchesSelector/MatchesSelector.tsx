import React, { ReactNode, useState } from 'react';

import s from './MatchesSelector.module.scss';
import Select, { MenuPlacement } from 'react-select';
import { useFormContext } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import clsx from 'clsx';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { useToggle } from 'react-use';

interface Props {
  title: string;
  icon: ReactNode;
  hint: string;
  options: { value: string; label: string }[];
  name: string;
  menuPlacement?: MenuPlacement;
  selectLabel: string;
  warning: boolean;
  placeholder: string;
}

const filterAndSort = (option: { value: string; label: string }, input: string) => {
  if (!input) return true;

  return option.label.toLowerCase().includes(input.toLowerCase());
};

export const MatchesSelector = ({ icon, title, hint, options, name, menuPlacement = 'bottom', selectLabel, warning, placeholder }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const { setValue, watch, getValues } = useFormContext();
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as { value: string; label: string }[];
  const [open, toggleOpen] = useToggle(val?.length > 0);
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  // Sort filtered options by label dynamically
  const sortedOptions = [...options].filter((option) => filterAndSort(option, inputValue)).sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  const isMobile = window.innerWidth <= 768;

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
          <Select
            menuPlacement={menuPlacement}
            isMulti
            onInputChange={(value) => setInputValue(value)}
            inputValue={inputValue}
            // autoFocus
            options={sortedOptions}
            filterOption={() => true}
            isClearable={false}
            placeholder={placeholder}
            // @ts-ignore
            value={val}
            menuIsOpen={menuIsOpen}
            onMenuOpen={() => setMenuIsOpen(true)}
            onMenuClose={isMobile ? undefined : () => setMenuIsOpen(false)}
            closeMenuOnScroll={false}
            blurInputOnSelect={false}
            menuShouldBlockScroll={isMobile && menuIsOpen}
            onChange={(val) => {
              setValue(name, val, { shouldValidate: true, shouldDirty: true });
            }}
            styles={{
              container: (base) =>
                isMobile && menuIsOpen
                  ? {
                      ...base,
                      width: '100%',
                      position: 'fixed',
                      left: 0,
                      top: 0,
                      zIndex: 10,
                      background: 'white',
                    }
                  : {
                      ...base,
                      width: '100%',
                    },
              control: (baseStyles) =>
                isMobile && menuIsOpen
                  ? {
                      ...baseStyles,
                      alignItems: 'center',
                      gap: '4px',
                      alignSelf: 'stretch',
                      border: '1px solid rgba(203, 213, 225, 0.50)',
                      background: '#fff',
                      outline: 'none',
                      fontSize: '14px',
                      minWidth: '140px',
                      borderColor: 'rgba(203, 213, 225, 0.50) !important',
                      boxShadow: 'none !important',
                      '&:hover': {
                        border: '1px solid #5E718D',
                        boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                        borderColor: '#5E718D !important',
                      },
                      '&:focus-visible, &:focus': {
                        borderColor: '#5E718D !important',
                        boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                      },
                      marginTop: '48px',
                      zIndex: 11,
                      marginInline: '4px',
                    }
                  : {
                      ...baseStyles,
                      alignItems: 'center',
                      gap: '4px',
                      alignSelf: 'stretch',
                      borderRadius: '8px',
                      border: '1px solid rgba(203, 213, 225, 0.50)',
                      background: '#fff',
                      outline: 'none',
                      fontSize: '14px',
                      minWidth: '140px',
                      width: '100%',
                      borderColor: 'rgba(203, 213, 225, 0.50) !important',
                      position: 'relative',
                      boxShadow: 'none !important',
                      '&:hover': {
                        border: '1px solid #5E718D',
                        boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                        borderColor: '#5E718D !important',
                      },
                      '&:focus-visible, &:focus': {
                        borderColor: '#5E718D !important',
                        boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                      },
                    },
              input: (baseStyles) => ({
                ...baseStyles,
                height: '32px',
                fontSize: '14px',
                padding: 0,
              }),
              placeholder: (base) => ({
                ...base,
                width: 'fit-content',
                fontSize: '14px',
              }),
              option: (baseStyles) => ({
                ...baseStyles,
                fontSize: '14px',
                fontWeight: 300,
                color: '#455468',
                '&:hover': {
                  background: 'rgba(27, 56, 96, 0.12)',
                },
              }),
              menu: (baseStyles) =>
                isMobile && menuIsOpen
                  ? {
                      ...baseStyles,
                      outline: 'none',
                      zIndex: 3,
                      width: 'calc(100vw - 8px)',
                      height: '100vh',
                      backgroundColor: 'white',
                      overflowY: 'auto',
                      marginTop: 0,
                      marginInline: '4px',
                      border: 'none',
                      boxShadow: 'none',
                    }
                  : {
                      ...baseStyles,
                      outline: 'none',
                      zIndex: 3,
                    },
              multiValueRemove: (base) => ({
                ...base,
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  background: 'transparent',
                },
              }),
              multiValue: (base) => ({
                ...base,
                marginBlock: '1px',
                display: 'flex',
                padding: 'var(--spacing-4xs, 4px) var(--spacing-3xs, 6px)',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--spacing-5xs, 2px)',
                borderRadius: 'var(--corner-radius-sm, 6px)',
                border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
                background: 'var(--background-base-white, #FFF)',
                boxShadow: '0px 1px 2px 0px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
              }),
              multiValueLabel: (base) => ({
                ...base,
                fontSize: '14px',
                color: '#455468',
                fontWeight: 300,
                fontStyle: 'normal',
                letterSpacing: '-0.2px',
              }),
              indicatorSeparator: (base) => ({
                display: 'none',
              }),
            }}
            classNames={{
              placeholder: () =>
                clsx(s.placeholder, {
                  [s.hidePlaceholder]: val.length > 0,
                }),
              control: () => s.control,
            }}
          />
          {menuIsOpen && isMobile && (
            <button
              onClick={() => setMenuIsOpen(false)}
              style={{
                position: 'fixed',
                top: 10,
                right: 16,
                zIndex: 10002,
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
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
      fill="currentColor"
    />
  </svg>
);

export function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" />
    </svg>
  );
}
