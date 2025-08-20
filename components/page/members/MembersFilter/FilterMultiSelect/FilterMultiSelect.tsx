'use client';

import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Input } from '@base-ui-components/react/input';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import s from '@/components/page/recommendations/components/MatchesSelector/MatchesSelector.module.scss';
import mobileStyles from './FilterMultiSelect.module.scss';
import Select from 'react-select';
import clsx from 'clsx';
import { useMedia, useToggle } from 'react-use';

interface Props {
  label: string;
  placeholder: string;
  paramKey: string;
  useDataHook?: (input: string) => { data?: any[] };
  backLabel?: string;
  placement?: 'top' | 'bottom' | 'auto';
  isDisabled?: boolean;
}

export function FilterMultiSelect({ label, placeholder, paramKey, useDataHook = useGetRoles, backLabel = 'Back', placement = 'auto', isDisabled }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [open, toggleOpen] = useToggle(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isMobile = useMedia('(max-width: 960px)', false);
  const { params, setParam } = useFilterStore();

  // Get initial values from URL parameters
  const getInitialValues = () => {
    const paramValue = params.get(paramKey);
    if (!paramValue) return [];

    return paramValue.split(URL_QUERY_VALUE_SEPARATOR).map((value) => ({
      value: value.trim(),
      label: value.trim(),
    }));
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

  return (
    <>
      {/* Mobile Fullscreen View */}
      {open && (
        <div className={mobileStyles.mobileRoot}>
          <div className={mobileStyles.mobileHeader}>
            <button className={mobileStyles.backWrapper} onClick={toggleOpen}>
              <ArrowBackIcon /> {backLabel}
            </button>
            <button onClick={toggleOpen}>
              <CloseIcon />
            </button>
          </div>
          <div className={mobileStyles.mobileSearchWrapper}>
            <Input autoFocus className={mobileStyles.mobileSearchInput} placeholder={placeholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <SearchIcon />
          </div>
          <div className={mobileStyles.mobileOptions}>{renderMobileOptions()}</div>
        </div>
      )}

      <FormProvider {...methods}>
        <form onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
          <div
            className={clsx(s.Content, {
              [s.disabled]: isDisabled,
            })}
          >
            <div className={s.inputLabel}>{label}</div>
            {!val.length && (
              <div className={s.plusIcon}>
                <PlusIcon />
              </div>
            )}
            <Select
              menuPlacement={options.length > 6 ? placement : 'bottom'}
              isMulti
              onInputChange={(value, actionMeta) => {
                if (actionMeta.action !== 'input-blur' && actionMeta.action !== 'menu-close' && actionMeta.action !== 'set-value') {
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
                setValue(paramKey, selectedOptions ? [...selectedOptions] : [], { shouldValidate: true, shouldDirty: true });
              }}
              isDisabled={open || isDisabled}
              onMenuOpen={() => {
                if (!isMobile || isRemoving) {
                  return;
                }
                toggleOpen();
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
                  paddingLeft: val.length > 0 ? 0 : 24,
                }),
                input: (baseStyles) => ({
                  ...baseStyles,
                  height: '28px',
                  fontSize: '14px',
                  padding: 0,
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
                menu: (baseStyles) => ({
                  ...baseStyles,
                  outline: 'none',
                  zIndex: 3,
                  padding: '8px',
                  borderRadius: 'var(--corner-radius-xl, 12px)',
                  border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
                  background: 'var(--background-base-white, #FFF)',
                  boxShadow: '0 10px 20px -5px var(--transparent-dark-6, rgba(14, 15, 17, 0.06)), 0 20px 65px -5px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
                }),
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
                        {props.data.description && <div className={mobileStyles.optionDesc}>{props.data.description}</div>}
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
                  const handleRemoveClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();

                    // Set removing state to prevent mobile menu from opening
                    setIsRemoving(true);

                    // Execute the remove action
                    // @ts-ignore
                    props.removeProps.onClick?.(e);

                    // Reset removing state after a short delay
                    setTimeout(() => {
                      setIsRemoving(false);
                    }, 100);
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
                    setIsRemoving(true);
                  };

                  const handleTouchEnd = (e: React.TouchEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();

                    // Reset removing state after touch end
                    setTimeout(() => {
                      setIsRemoving(false);
                    }, 100);
                  };

                  return (
                    <div
                      className={mobileStyles.tag}
                      onMouseDown={(e) => {
                        // Only stop propagation if clicking on the tag itself, not the remove button
                        if (e.target === e.currentTarget) {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                        }
                      }}
                      onTouchStart={(e) => {
                        // Only stop propagation if touching the tag itself, not the remove button
                        if (e.target === e.currentTarget) {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                        }
                      }}
                    >
                      <span>{props.data.label}</span>
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
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={mobileStyles.searchIcon}>
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
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 1.82812C7.08154 1.82813 5.69493 2.24875 4.51552 3.0368C3.33611 3.82486 2.41688 4.94495 1.87405 6.25544C1.33123 7.56593 1.18921 9.00796 1.46593 10.3992C1.74266 11.7904 2.42572 13.0683 3.42872 14.0713C4.43173 15.0743 5.70963 15.7573 7.10084 16.0341C8.49205 16.3108 9.93407 16.1688 11.2446 15.6259C12.555 15.0831 13.6751 14.1639 14.4632 12.9845C15.2513 11.8051 15.6719 10.4185 15.6719 9C15.6698 7.09855 14.9135 5.27558 13.569 3.93105C12.2244 2.58652 10.4015 1.83023 8.5 1.82812ZM8.5 14.5781C7.39675 14.5781 6.31828 14.251 5.40096 13.638C4.48364 13.0251 3.76868 12.1539 3.34649 11.1347C2.92429 10.1154 2.81383 8.99381 3.02906 7.91176C3.24429 6.82971 3.77556 5.83578 4.55567 5.05567C5.33579 4.27555 6.32971 3.74429 7.41176 3.52906C8.49381 3.31382 9.61539 3.42429 10.6347 3.84648C11.6539 4.26868 12.5251 4.98364 13.138 5.90096C13.751 6.81828 14.0781 7.89675 14.0781 9C14.0765 10.4789 13.4883 11.8968 12.4426 12.9426C11.3968 13.9883 9.97893 14.5765 8.5 14.5781ZM11.9531 9C11.9531 9.21134 11.8692 9.41403 11.7197 9.56348C11.5703 9.71292 11.3676 9.79688 11.1563 9.79688H9.29688V11.6562C9.29688 11.8676 9.21292 12.0703 9.06348 12.2197C8.91403 12.3692 8.71135 12.4531 8.5 12.4531C8.28866 12.4531 8.08597 12.3692 7.93653 12.2197C7.78708 12.0703 7.70313 11.8676 7.70313 11.6562V9.79688H5.84375C5.63241 9.79688 5.42972 9.71292 5.28028 9.56348C5.13083 9.41403 5.04688 9.21134 5.04688 9C5.04688 8.78866 5.13083 8.58597 5.28028 8.43652C5.42972 8.28708 5.63241 8.20312 5.84375 8.20312H7.70313V6.34375C7.70313 6.13241 7.78708 5.92972 7.93653 5.78027C8.08597 5.63083 8.28866 5.54688 8.5 5.54688C8.71135 5.54688 8.91403 5.63083 9.06348 5.78027C9.21292 5.92972 9.29688 6.13241 9.29688 6.34375V8.20312H11.1563C11.3676 8.20312 11.5703 8.28708 11.7197 8.43652C11.8692 8.58597 11.9531 8.78866 11.9531 9Z"
      fill="#455468"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
