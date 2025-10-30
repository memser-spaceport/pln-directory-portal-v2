import React, { ReactNode, useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';
import { Input } from '@base-ui-components/react/input';

import Select from 'react-select';

import s from './FormSelect.module.scss';
import { clsx } from 'clsx';
import { useMedia, useToggle } from 'react-use';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type Option = { label: string; value: string; description?: string; originalObject?: any };

type RenderOptionInput = {
  option: Option;
  label: ReactNode;
  description: ReactNode;
};

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: Option[];
  disabled?: boolean;
  isRequired?: boolean;
  notFoundContent?: ReactNode;
  isStickyNoData?: boolean;
  backLabel?: string;
  onChange?: (value: { label: string; value: string; originalObject?: any } | null) => void;
  renderOption?: (input: RenderOptionInput) => ReactNode;
}

export const FormSelect = (props: Props) => {
  const {
    name,
    placeholder,
    label,
    description,
    options,
    disabled,
    isRequired,
    notFoundContent,
    backLabel,
    onChange,
    isStickyNoData,
  } = props;

  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();

  const value = watch(name);

  const renderSelectOption = (option: Option) => {
    const renderOption =
      props.renderOption ||
      function ({ label, description }) {
        return (
          <>
            {label}
            {description}
          </>
        );
      };

    const { label, description } = option;

    return renderOption({
      option,
      label: <div className={s.optionLabel}>{label}</div>,
      description: description && <div className={s.optionDesc}>{description}</div>,
    });
  };

  const [open, toggleOpen] = useToggle(false);
  const isMobile = useMedia('(max-width: 960px)', false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create options array with notFoundContent as the last option
  const enhancedOptions = React.useMemo(() => {
    const baseOptions = [...options];
    if (notFoundContent) {
      baseOptions.push({
        label: '',
        value: '__not_found_content__',
        isNotFoundContent: true,
      } as any);
    }
    return baseOptions;
  }, [options, notFoundContent]);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  function renderMobileOptions() {
    const filtered = options.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filtered.length === 0) {
      return (
        <div className={s.notFound}>
          <span>No options found</span>
          {notFoundContent}
        </div>
      );
    }

    const optionElements = filtered.map((item) => {
      return (
        <div
          key={item.value}
          className={clsx(s.mobileOption, {
            [s.active]: value?.value === item.value,
          })}
          onClick={() => {
            setValue(name, item, { shouldValidate: true, shouldDirty: true });
            onChange?.(item);
            toggleOpen();
          }}
        >
          {renderSelectOption(item)}
        </div>
      );
    });

    // Always add notFoundContent as the last element if it exists, regardless of filtering
    if (notFoundContent) {
      optionElements.push(
        <div key="not-found-content" className={s.notFoundContent}>
          {notFoundContent}
        </div>,
      );
    }

    return optionElements;
  }

  return (
    <>
      {open && (
        <div className={s.mobileRoot}>
          <div className={s.mobileHeader}>
            <button className={s.backWrapper} onClick={toggleOpen}>
              <ArrowBackIcon /> {backLabel}
            </button>
            <button onClick={toggleOpen}>
              <CloseIcon />
            </button>
          </div>
          <div className={s.mobileSearchWrapper}>
            <Input
              autoFocus
              className={s.mobileSearchInput}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon />
          </div>
          <div className={s.mobileOptions}>{renderMobileOptions()}</div>
        </div>
      )}
      <Field.Root className={s.field}>
        {label && (
          <Field.Label
            className={clsx(s.label, {
              [s.required]: isRequired,
            })}
          >
            {label}
          </Field.Label>
        )}
        <Select
          menuPlacement="auto"
          placeholder={placeholder}
          options={enhancedOptions}
          value={value}
          defaultValue={value}
          onChange={(val) => {
            // Don't allow selection of the notFoundContent option
            if (val && (val as any).isNotFoundContent) {
              return;
            }
            setValue(name, val, { shouldValidate: true, shouldDirty: true });
            onChange?.(val as { label: string; value: string } | null);
          }}
          isDisabled={disabled || open}
          inputId={name}
          filterOption={(option, inputValue) => {
            // Always include the notFoundContent option
            if ((option.data as any).isNotFoundContent) {
              return true;
            }
            // Default filtering for regular options
            return option.label.toLowerCase().includes(inputValue.toLowerCase());
          }}
          onMenuOpen={() => {
            if (!isMobile) {
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
              minWidth: '140px',
              width: '100%',
              borderColor: 'rgba(203, 213, 225, 0.50) !important',
              position: 'relative',
              fontSize: '16px',
              color: '#455468',
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
              ...(!!errors[name]
                ? {
                    borderColor: 'var(--action-border-error-focus) !important',
                  }
                : {}),
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              height: '42px',
              padding: 0,
              fontSize: 16,
              // background: 'tomato',
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
            menuList: (base) => ({
              ...base,
              width: '100%',
              padding: 0,
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 3,
              display: 'flex',
              padding: '8px',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              color: '#CBD5E1',
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
          components={{
            NoOptionsMessage: () => {
              return (
                <div className={s.notFound}>
                  <span>No options found</span>
                  {notFoundContent}
                </div>
              );
            },
            Option: (props) => {
              // Handle the special notFoundContent option
              if ((props.data as any).isNotFoundContent) {
                return (
                  <div
                    className={clsx(s.notFoundContent, {
                      [s.sticky]: isStickyNoData,
                    })}
                  >
                    {notFoundContent}
                  </div>
                );
              }

              return (
                <div onClick={() => props.selectOption(props.data)} className={s.option}>
                  {renderSelectOption(props.data)}
                </div>
              );
            },
          }}
        />
        {!errors[name] && description ? (
          <Field.Description className={s.fieldDescription}>
            <InfoIcon /> {description}
          </Field.Description>
        ) : (
          <Field.Error className={s.errorMsg} match={!!errors[name]}>
            {(errors?.[name]?.message as string) ?? ''}
          </Field.Error>
        )}
      </Field.Root>
    </>
  );
};

const ArrowBackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.0006 12.0004C21.0006 12.1993 20.9216 12.3901 20.7809 12.5307C20.6403 12.6714 20.4495 12.7504 20.2506 12.7504H5.5609L11.0312 18.2198C11.1009 18.2895 11.1562 18.3722 11.1939 18.4632C11.2316 18.5543 11.251 18.6519 11.251 18.7504C11.251 18.849 11.2316 18.9465 11.1939 19.0376C11.1562 19.1286 11.1009 19.2114 11.0312 19.281C10.9615 19.3507 10.8788 19.406 10.7878 19.4437C10.6967 19.4814 10.5991 19.5008 10.5006 19.5008C10.402 19.5008 10.3045 19.4814 10.2134 19.4437C10.1224 19.406 10.0396 19.3507 9.96996 19.281L3.21996 12.531C3.15023 12.4614 3.09491 12.3787 3.05717 12.2876C3.01943 12.1966 3 12.099 3 12.0004C3 11.9019 3.01943 11.8043 3.05717 11.7132C3.09491 11.6222 3.15023 11.5394 3.21996 11.4698L9.96996 4.71979C10.1107 4.57906 10.3016 4.5 10.5006 4.5C10.6996 4.5 10.8905 4.57906 11.0312 4.71979C11.1719 4.86052 11.251 5.05139 11.251 5.25042C11.251 5.44944 11.1719 5.64031 11.0312 5.78104L5.5609 11.2504H20.2506C20.4495 11.2504 20.6403 11.3294 20.7809 11.4701C20.9216 11.6107 21.0006 11.8015 21.0006 12.0004Z"
      fill="#455468"
    />
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
    className={s.searchIcon}
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

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.99929 2.35229C7.6845 2.35229 6.39923 2.74218 5.30601 3.47264C4.2128 4.2031 3.36074 5.24133 2.85759 6.45605C2.35444 7.67076 2.2228 9.0074 2.4793 10.2969C2.7358 11.5865 3.36894 12.771 4.29864 13.7007C5.22834 14.6304 6.41285 15.2635 7.70239 15.52C8.99192 15.7765 10.3286 15.6449 11.5433 15.1417C12.758 14.6386 13.7962 13.7865 14.5267 12.6933C15.2571 11.6001 15.647 10.3148 15.647 9.00002C15.6452 7.23751 14.9442 5.54771 13.6979 4.30142C12.4516 3.05514 10.7618 2.35416 8.99929 2.35229ZM8.99929 14.625C7.88677 14.625 6.79924 14.2951 5.87421 13.677C4.94918 13.059 4.22821 12.1805 3.80247 11.1526C3.37673 10.1248 3.26533 8.99378 3.48238 7.90264C3.69942 6.8115 4.23515 5.80922 5.02182 5.02255C5.80849 4.23588 6.81077 3.70015 7.90191 3.4831C8.99305 3.26606 10.1241 3.37746 11.1519 3.8032C12.1797 4.22894 13.0582 4.94991 13.6763 5.87494C14.2944 6.79997 14.6243 7.8875 14.6243 9.00002C14.6226 10.4913 14.0294 11.9211 12.9749 12.9756C11.9204 14.0302 10.4906 14.6233 8.99929 14.625ZM10.022 12.0682C10.022 12.2038 9.96814 12.3339 9.87225 12.4298C9.77635 12.5257 9.64628 12.5796 9.51066 12.5796C9.23941 12.5796 8.97928 12.4718 8.78748 12.28C8.59568 12.0882 8.48793 11.8281 8.48793 11.5568V9.00002C8.35231 9.00002 8.22224 8.94615 8.12634 8.85025C8.03044 8.75435 7.97657 8.62428 7.97657 8.48866C7.97657 8.35304 8.03044 8.22297 8.12634 8.12707C8.22224 8.03117 8.35231 7.97729 8.48793 7.97729C8.75917 7.97729 9.01931 8.08505 9.21111 8.27684C9.4029 8.46864 9.51066 8.72878 9.51066 9.00002V11.5568C9.64628 11.5568 9.77635 11.6107 9.87225 11.7066C9.96814 11.8025 10.022 11.9326 10.022 12.0682ZM7.97657 6.18752C7.97657 6.03581 8.02155 5.88751 8.10584 5.76137C8.19012 5.63523 8.30992 5.53692 8.45008 5.47886C8.59023 5.42081 8.74446 5.40562 8.89325 5.43522C9.04205 5.46481 9.17872 5.53787 9.28599 5.64514C9.39327 5.75241 9.46632 5.88909 9.49592 6.03788C9.52551 6.18667 9.51032 6.3409 9.45227 6.48106C9.39421 6.62122 9.2959 6.74101 9.16976 6.8253C9.04362 6.90958 8.89532 6.95457 8.74361 6.95457C8.54018 6.95457 8.34508 6.87375 8.20123 6.72991C8.05738 6.58606 7.97657 6.39096 7.97657 6.18752Z"
      fill="#455468"
    />
  </svg>
);
