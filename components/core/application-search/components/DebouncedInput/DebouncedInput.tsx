import { debounce } from 'lodash';
import React, { FC, KeyboardEventHandler, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import s from './DebouncedInput.module.scss';
import Image from 'next/image';
import clsx from 'clsx';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  onlyNumbers?: boolean;
  type?: 'text' | 'number';
  flushIcon?: ReactNode;
  onImplictFlush?: () => void;
  hideFlushIconOnValueInput?: boolean;
  clearIcon?: ReactNode;
  classes?: {
    root?: string;
    input?: string;
    clearBtn?: string;
    flushBtn?: string;
  };
  ids?: {
    root?: string;
    input?: string;
  };
}

export const DebouncedInput: FC<Props> = ({
  ids,
  value,
  classes,
  onChange,
  clearIcon,
  onBlur,
  disabled,
  placeholder,
  type,
  hideFlushIconOnValueInput = false,
  onlyNumbers,
  flushIcon,
  onImplictFlush,
  onFocus,
  onClick,
  ...rest
}) => {
  const [localValue, setLocalValue] = useState(value);
  const hideFlushIcon = hideFlushIconOnValueInput && !!localValue;

  const debouncedChange = useMemo(
    () =>
      debounce((val: string) => {
        onChange(val);
      }, 700),
    [onChange],
  );

  const handleKeyPress = useCallback<KeyboardEventHandler>(
    (e) => {
      if (type === 'text' && onlyNumbers && !/^[0-9.]$/.test(e.key)) {
        e.preventDefault();
      }
    },
    [onlyNumbers, type],
  );

  const handleKeyUp = useCallback<KeyboardEventHandler>(
    (e) => {
      if (e.key === 'Enter') {
        debouncedChange.flush();
        onImplictFlush?.();
        // onClick?.();
      } else if (e.key === 'Escape') {
        debouncedChange.cancel();
        setLocalValue('');
        onChange('');
      }
    },
    [debouncedChange, onChange, onImplictFlush],
  );

  useEffect(() => {
    // Sync if parent changes the value
    if (value !== localValue) {
      setLocalValue(value);
    }
    // eslint-disable-next-line
  }, [value]);

  return (
    <div className={clsx(s.root, classes?.root)} id={ids?.root ?? 'application-search-input-root'}>
      <input
        id={ids?.input ?? 'application-search-input'}
        type="text"
        value={localValue}
        onKeyPress={handleKeyPress}
        onKeyUp={handleKeyUp}
        onChange={(e) => {
          const val = e.target.value;
          // debouncedChange.cancel();
          setLocalValue(val);
          debouncedChange(val);
        }}
        className={classes?.input}
        onClick={onClick}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        placeholder={placeholder ?? 'Search'}
        {...rest}
      />
      {localValue && (
        <button
          id="application-search-clear"
          className={clsx(s.clearButton, classes?.clearBtn, {
            [s.singleView]: !flushIcon || hideFlushIcon,
          })}
          onClick={() => {
            debouncedChange.cancel();
            setLocalValue('');
            onChange('');
          }}
        >
          {clearIcon || (
            <Image
              src="/icons/close-gray.svg"
              alt="Search"
              width={20}
              height={20}
              style={{ pointerEvents: 'none' }}
              id="application-search-clear-icon"
            />
          )}
        </button>
      )}
      {flushIcon && !hideFlushIcon && (
        <button
          id="application-search-flush"
          className={clsx(s.flushButton, classes?.flushBtn)}
          onClick={() => {
            debouncedChange.flush();
            onImplictFlush?.();
          }}
        >
          <span style={{ pointerEvents: 'none' }}>{flushIcon}</span>
        </button>
      )}
    </div>
  );
};
