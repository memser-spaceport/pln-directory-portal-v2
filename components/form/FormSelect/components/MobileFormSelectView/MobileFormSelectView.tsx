import { clsx } from 'clsx';
import React, { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '@base-ui-components/react/input';
import { Option } from '@/components/form/FormSelect/types';

import { SearchIcon, CloseIcon, ArrowBackIcon } from '@/components/icons';

import s from './MobileFormSelectView.module.scss';

interface Props {
  name: string;
  backLabel?: string;
  placeholder: string;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  options: Option[];
  notFoundContent?: ReactNode;
  onChange?: (value: Option | null) => void;
  renderSelectOption: (option: Option) => ReactNode;
}

export function MobileFormSelectView(props: Props) {
  const {
    name,
    options,
    onChange,
    backLabel,
    toggleOpen,
    placeholder,
    searchTerm,
    setSearchTerm,
    notFoundContent,
    renderSelectOption,
  } = props;

  const { watch, setValue } = useFormContext();

  const value = watch(name);

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
          className={clsx(s.option, {
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

    return optionElements;
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <button className={s.backWrapper} onClick={toggleOpen}>
          <ArrowBackIcon className={s.backIcon} /> {backLabel}
        </button>
        <button onClick={toggleOpen}>
          <CloseIcon className={s.closeIcon} />
        </button>
      </div>
      <div className={s.searchWrapper}>
        <Input
          autoFocus
          className={s.searchInput}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchIcon className={s.searchIcon} />
      </div>
      <div className={s.options}>{renderMobileOptions()}</div>
      {notFoundContent && <div className={s.notFound}>{notFoundContent}</div>}
    </div>
  );
}
