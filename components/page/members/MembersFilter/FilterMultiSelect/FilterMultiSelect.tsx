'use client';

import clsx from 'clsx';
import Select from 'react-select';
import { createPortal } from 'react-dom';
import { useMedia, useToggle } from 'react-use';
import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Input } from '@base-ui-components/react/input';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import s from '@/components/page/recommendations/components/MatchesSelector/MatchesSelector.module.scss';
import mobileStyles from './FilterMultiSelect.module.scss';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getInitialValues as getInitialValuesFromUrl } from '@/components/page/members/MembersFilter/utils/getInitialValues';

interface Props {
  label: string;
  placeholder: string;
  paramKey: string;
  useDataHook?: (input: string) => { data?: any[] };
  backLabel?: string;
  placement?: 'top' | 'bottom' | 'auto';
  isDisabled?: boolean;
}

export function FilterMultiSelect({
  label,
  placeholder,
  paramKey,
  useDataHook = useGetRoles,
  backLabel = 'Back',
  placement = 'auto',
  isDisabled,
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [open, toggleOpen] = useToggle(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isMobile = useMedia('(max-width: 960px)', false);
  const { params, setParam } = useFilterStore();
  const {
    onMembersTopicsFilterSearched,
    onMembersRolesFilterSearched,
    onMembersTopicsFilterSelected,
    onMembersRolesFilterSelected,
  } = useMemberAnalytics();

  // Get initial values from URL parameters
  const getInitialValues = () => {
    return getInitialValuesFromUrl(params, paramKey);
  };

  const methods = useForm<Record<string, any[]>>({
    defaultValues: { [paramKey]: getInitialValues() },
  });

  const { watch, setValue, reset } = methods;
  const val = watch(paramKey);

  const { data: options = [] } = useDataHook(isMobile && open ? searchTerm : inputValue);

  // Mobile options rendering function
  function renderMobileOptions() {
    const filtered = options.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filtered.length === 0) {
      return (
        <div className={mobileStyles.notFound}>
          <span>No options found</span>
        </div>
      );
    }

    return filtered.map((item) => {
      const isSelected = val.some((selected: any) => selected.value === item.value);
      return (
        <div
          key={item.value}
          className={clsx(mobileStyles.mobileOption, {
            [mobileStyles.active]: isSelected,
          })}
          onClick={() => {
            if (isSelected) {
              // Remove from selection
              const newValue = val.filter((selected: any) => selected.value !== item.value);
              setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
            } else {
              // Add to selection
              const newValue = [...val, item];
              setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
            }
          }}
        >
          <div className={mobileStyles.optionLabel}>{item.label}</div>
          {item.description && <div className={mobileStyles.optionDesc}>{item.description}</div>}
          {item.count && <div className={mobileStyles.optionCount}>{item.count}</div>}
        </div>
      );
    });
  }

  // Sync form with URL parameters when they change
  useEffect(() => {
    const currentValues = getInitialValues();
    setValue(paramKey, currentValues);
  }, [params.get(paramKey), paramKey, setValue]);

  // Update URL parameters when form values change
  useEffect(() => {
    if (val && val.length > 0) {
      const values = val.map((item: any) => item.value).join(URL_QUERY_VALUE_SEPARATOR);
      setParam(paramKey, values);
    } else {
      setParam(paramKey, undefined);
    }
  }, [val, paramKey, setParam]);

  // Handle body scroll locking for iOS Safari when mobile view is open
  useEffect(() => {
    if (open && isMobile) {
      // Lock body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [open, isMobile]);

  // Mobile fullscreen view component
  const renderMobileFullscreen = () => {
    if (!open || typeof window === 'undefined') return null;

    return createPortal(
      <div className={mobileStyles.mobileRoot}>
        <button className={mobileStyles.mobileHeader} type="button" aria-label="Close">
          <div className={mobileStyles.backWrapper} onClick={toggleOpen}>
            <ArrowBackIcon /> {backLabel}
          </div>
        </button>

        <div className={s.inputContainer}>
          <div className={mobileStyles.headerRow}>
            <div className={s.inputLabel}>{label}</div>
            <button
              type="button"
              className={mobileStyles.clearAllButton}
              onClick={() => {
                reset();
                setSearchTerm('');
              }}
            >
              Clear all
            </button>
          </div>
          <div className={mobileStyles.mobileSearchWrapper}>
            <Input
              autoFocus
              className={mobileStyles.mobileSearchInput}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className={mobileStyles.clearSearchButton}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            ) : (
              <SearchIcon />
            )}
          </div>
        </div>
        <div className={mobileStyles.mobileOptions}>{renderMobileOptions()}</div>
      </div>,
      document.body,
    );
  };

  return (
    <>
      {/* Mobile Fullscreen View in Portal */}
      {renderMobileFullscreen()}

      <FormProvider {...methods}>
        <form onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
          <div
            className={clsx(s.Content, {
              [s.disabled]: isDisabled,
            })}
          >
            <div className={mobileStyles.headerRow}>
              <div className={s.inputLabel}>{label}</div>
            </div>
            <div className={s.plusIcon}>
              <PlusIcon />
            </div>
            <Select
              menuPlacement={options.length > 6 ? placement : 'bottom'}
              isMulti
              onInputChange={(value, actionMeta) => {
                if (
                  actionMeta.action !== 'input-blur' &&
                  actionMeta.action !== 'menu-close' &&
                  actionMeta.action !== 'set-value'
                ) {
                  if (paramKey === 'topics') {
                    onMembersTopicsFilterSearched({ page: 'Members', searchText: value });
                  } else if (paramKey === 'roles') {
                    onMembersRolesFilterSearched({ page: 'Members', searchText: value });
                  }

                  setInputValue(value);
                }
              }}
              inputValue={inputValue}
              // autoFocus
              options={options}
              isClearable={false}
              placeholder={placeholder}
              closeMenuOnSelect={false}
              blurInputOnSelect={false}
              value={val}
              onChange={(selectedOptions) => {
                const newOptions = selectedOptions ? [...selectedOptions] : [];

                setValue(paramKey, newOptions, { shouldValidate: true, shouldDirty: true });

                if (paramKey === 'topics') {
                  onMembersTopicsFilterSelected({ page: 'Members', topics: newOptions });
                } else if (paramKey === 'roles') {
                  onMembersRolesFilterSelected({ page: 'Members', roles: newOptions });
                }

                setInputValue('');
              }}
              isDisabled={open || isDisabled}
              onMenuOpen={() => {
                // Add a small delay to check if we're in a removing state
                setTimeout(() => {
                  if (!isMobile || isRemoving) {
                    return;
                  }
                  toggleOpen();
                }, 10);
              }}
              styles={{
                container: (base) => ({
                  ...base,
                  width: '100%',
                }),
                control: (baseStyles) => ({
                  ...baseStyles,
                  alignItems: 'center',
                  gap: '8px',
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
                  '> div': {
                    gap: '2px',
                    padding: '2px 4px',
                  },
                  '> div:last-child': {
                    margin: 0,
                  },
                  input: {
                    textAlign: 'left',
                    width: 'fit-content !important',
                  },
                  paddingRight: val.length > 0 ? 0 : 24,
                }),
                input: (baseStyles) => ({
                  ...baseStyles,
                  height: '28px',
                  fontSize: '14px',
                  padding: 0,
                  textAlign: 'left',
                  width: 'fit-content !important',
                }),
                placeholder: (base) => ({
                  ...base,
                  width: 'fit-content',
                  color: '#AFBACA',
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
                menu: (baseStyles, state) => {
                  return {
                    ...baseStyles,
                    display: inputValue ? 'block' : 'none',
                    outline: 'none',
                    zIndex: 3,
                    padding: '8px',
                    borderRadius: 'var(--corner-radius-xl, 12px)',
                    border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
                    background: 'var(--background-base-white, #FFF)',
                    boxShadow:
                      '0 10px 20px -5px var(--transparent-dark-6, rgba(14, 15, 17, 0.06)), 0 20px 65px -5px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
                  };
                },
                multiValueRemove: (base) => ({
                  ...base,
                  display: 'none', // Hide default remove button since we use custom one
                }),
                multiValue: (base) => ({
                  display: 'none', // Hide default multiValue since we use custom component
                }),
                multiValueLabel: (base) => ({
                  display: 'none', // Hide default label since we use custom component
                }),
                indicatorSeparator: (base) => ({
                  display: 'none',
                }),
                indicatorsContainer: (base) => ({
                  display: 'none', // Hide all indicators
                }),
                // menuList: (baseStyles) => ({
                //   ...baseStyles,
                //   background: 'red',
                // }),
              }}
              classNames={{
                placeholder: () =>
                  clsx(s.placeholder, {
                    [s.hidePlaceholder]: val.length > 0,
                  }),
                control: () => s.control,
                menuList: () => s.menu,
              }}
              components={{
                Option: (props) => {
                  const isSelected = val.some((selected: any) => selected.value === props.data.value);
                  const count = props.data.count || 0;

                  return (
                    <div
                      {...props.innerProps}
                      className={clsx(mobileStyles.desktopOption, {
                        [mobileStyles.active]: isSelected,
                        [mobileStyles.focused]: props.isFocused,
                      })}
                    >
                      <div className={mobileStyles.optionContent}>
                        <div className={mobileStyles.optionLabel}>{props.data.label}</div>
                        {props.data.description && (
                          <div className={mobileStyles.optionDesc}>{props.data.description}</div>
                        )}
                      </div>
                      <div className={mobileStyles.optionRight}>
                        {count > 0 && <span className={mobileStyles.countBadge}>{count}</span>}
                        {isSelected && (
                          <div className={mobileStyles.checkmark}>
                            <CheckmarkIcon />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
                MultiValue: (props) => {
                  let touchStartTime = 0;

                  const executeRemove = () => {
                    // Set removing state to prevent mobile menu from opening
                    setIsRemoving(true);

                    // Execute the remove action
                    // @ts-ignore
                    props.removeProps.onClick?.();

                    // Reset removing state after a delay
                    setTimeout(() => {
                      setIsRemoving(false);
                    }, 300);
                  };

                  const handleRemoveClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    executeRemove();
                  };

                  const handleMouseDown = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  };

                  const handleTouchStart = (e: React.TouchEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();

                    touchStartTime = Date.now();
                    setIsRemoving(true);

                    // Execute remove immediately on touch start for iOS Safari
                    executeRemove();
                  };

                  const handleTouchEnd = (e: React.TouchEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();

                    // Prevent any additional actions
                    const touchDuration = Date.now() - touchStartTime;
                    if (touchDuration < 50) {
                      // Very quick touch, ensure remove action happened
                      executeRemove();
                    }
                  };

                  return (
                    <div className={mobileStyles.tag}>
                      <span className={mobileStyles.tagLabel}>{props.data.label}</span>
                      <button
                        className={mobileStyles.tagRemove}
                        onClick={handleRemoveClick}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        type="button"
                        aria-label={`Remove ${props.data.label}`}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  );
                },
              }}
            />
          </div>
        </form>
      </FormProvider>
    </>
  );
}

const ArrowBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 14L5 8L11 2" stroke="#156FF7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.2887 14.962C16.4649 15.1381 16.5638 15.377 16.5638 15.626C16.5638 15.8751 16.4649 16.114 16.2887 16.2901C16.1126 16.4662 15.8737 16.5652 15.6247 16.5652C15.3756 16.5652 15.1367 16.4662 14.9606 16.2901L10.0005 11.3284L5.03874 16.2885C4.86261 16.4647 4.62374 16.5636 4.37467 16.5636C4.1256 16.5636 3.88673 16.4647 3.71061 16.2885C3.53449 16.1124 3.43555 15.8735 3.43555 15.6245C3.43555 15.3754 3.53449 15.1365 3.71061 14.9604L8.67233 10.0003L3.71217 5.03854C3.53605 4.86242 3.43711 4.62355 3.43711 4.37448C3.43711 4.12541 3.53605 3.88654 3.71217 3.71042C3.88829 3.53429 4.12716 3.43535 4.37624 3.43535C4.62531 3.43535 4.86418 3.53429 5.0403 3.71042L10.0005 8.67213L14.9622 3.70963C15.1383 3.53351 15.3772 3.43457 15.6262 3.43457C15.8753 3.43457 16.1142 3.53351 16.2903 3.70963C16.4664 3.88575 16.5654 4.12462 16.5654 4.3737C16.5654 4.62277 16.4664 4.86164 16.2903 5.03776L11.3286 10.0003L16.2887 14.962Z"
      fill="#455468"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={mobileStyles.searchIcon}
  >
    <g clipPath="url(#clip0_3455_13280)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.41998 13.5776C6.74542 13.903 6.74542 14.4306 6.41998 14.7561L3.08665 18.0894C2.76121 18.4148 2.23358 18.4148 1.90814 18.0894C1.5827 17.764 1.5827 17.2363 1.90814 16.9109L5.24147 13.5776C5.56691 13.2521 6.09455 13.2521 6.41998 13.5776Z"
        fill="#475569"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8474 3.29272C10.9389 2.84168 11.3788 2.55026 11.8298 2.64182C15.0634 3.29819 17.4974 6.15565 17.4974 9.58347C17.4974 13.4955 14.3261 16.6668 10.4141 16.6668C7.32863 16.6668 4.70599 14.6945 3.73399 11.9445C3.58062 11.5106 3.80806 11.0345 4.24199 10.8811C4.67592 10.7277 5.15202 10.9552 5.30539 11.3891C6.04938 13.494 8.05691 15.0001 10.4141 15.0001C13.4056 15.0001 15.8307 12.575 15.8307 9.58347C15.8307 6.96391 13.9704 4.77698 11.4983 4.27517C11.0472 4.18362 10.7558 3.74376 10.8474 3.29272Z"
        fill="#475569"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.66689 13.7042C5.28395 13.9577 4.76742 13.8524 4.51319 13.469C2.69063 10.7202 2.98614 6.98362 5.4046 4.56517C8.16468 1.80509 12.6438 1.80929 15.4091 4.57456C17.5901 6.75553 18.0524 10.0009 16.7992 12.6282C16.6015 13.0428 16.1048 13.2179 15.6899 13.0194C15.275 12.8209 15.0989 12.3239 15.2966 11.9093C16.2558 9.89829 15.8994 7.41664 14.2332 5.75045C12.1186 3.63584 8.69335 3.63263 6.58271 5.74327C4.7345 7.59147 4.50657 10.4495 5.89995 12.5509C6.15418 12.9343 6.04983 13.4507 5.66689 13.7042Z"
        fill="#475569"
      />
    </g>
    <defs>
      <clipPath id="clip0_3455_13280">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const CheckmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#1B4DFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
