'use client';

/**
 * City picker over a static list.
 *
 * Production's `LocationSelect` is react-query + geocoding bound
 * (components/ui/LocationSelect/LocationSelect.tsx:57 hits
 * /v1/locations/autocomplete), so per the prototype rules it is copy-simplified
 * rather than imported. The chrome is transcribed from its react-select style
 * object (lines 119-174) so it measures like the real control: 8px radius,
 * rgba(203,213,225,.5) border, 32px input, 14px text, and the same hover ring.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { CITY_OPTIONS } from './mocks';
import { LocationIcon } from './icons';
import s from './CityCombobox.module.scss';

interface CityComboboxProps {
  value: { city: string; country: string } | null;
  onChange: (value: { city: string; country: string }) => void;
  placeholder?: string;
}

export function CityCombobox({ value, onChange, placeholder = 'Where will you be?' }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return CITY_OPTIONS.slice(0, 8);
    return CITY_OPTIONS.filter(
      (option) => option.city.toLowerCase().includes(needle) || option.country.toLowerCase().includes(needle),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const commit = (option: { city: string; country: string }) => {
    onChange(option);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={s.root} ref={rootRef}>
      <div className={`${s.control} ${open ? s.controlOpen : ''}`} onClick={() => setOpen(true)}>
        <LocationIcon fill="#8897AE" />
        <input
          className={s.input}
          // `{ city: '', country: '' }` is a truthy object but an empty value —
          // a day-one profile carries exactly that, and testing the object made
          // the control render ", " where the placeholder should be.
          value={open ? query : value?.city ? `${value.city}, ${value.country}` : ''}
          placeholder={value?.city ? `${value.city}, ${value.country}` : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlight((current) => Math.min(current + 1, matches.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlight((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' && matches[highlight]) {
              event.preventDefault();
              commit(matches[highlight]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
      </div>

      {open && (
        <ul className={s.menu} role="listbox">
          {matches.length === 0 && <li className={s.empty}>No cities found</li>}
          {matches.map((option, index) => (
            <li key={`${option.city}-${option.country}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={`${s.option} ${index === highlight ? s.optionActive : ''}`}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => commit(option)}
              >
                <span className={s.optionCity}>{option.city}</span>
                <span className={s.optionCountry}>{option.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
