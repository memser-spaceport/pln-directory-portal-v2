'use client';

import Select from 'react-select';

import { useAiAppTags } from '@/services/ai-apps/hooks/useAiAppTags';
import type { AiAppTag } from '@/services/ai-apps/ai-apps.service';

import s from './AiAppTagsSelect.module.scss';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

/** Multi-select over the controlled vocabulary; each option shows the tag's description as a subtitle. */
export function AiAppTagsSelect({ value, onChange, disabled }: Props) {
  const { tags, maxPerApp, isLoading } = useAiAppTags();
  const selected = value.map((slug) => tags.find((tag) => tag.slug === slug)).filter(Boolean) as AiAppTag[];
  const atCap = selected.length >= maxPerApp;

  return (
    <Select<AiAppTag, true>
      inputId="ai-app-tags"
      isMulti
      isClearable={false}
      isLoading={isLoading}
      isDisabled={disabled}
      options={tags}
      value={selected}
      getOptionValue={(tag) => tag.slug}
      getOptionLabel={(tag) => tag.label}
      isOptionDisabled={(tag) => atCap && !value.includes(tag.slug)}
      onChange={(next) => onChange(next.map((tag) => tag.slug))}
      placeholder={atCap ? `Up to ${maxPerApp} tags` : 'Select tags'}
      noOptionsMessage={() => (atCap ? `Up to ${maxPerApp} tags per app` : 'No tags found')}
      menuPlacement="auto"
      formatOptionLabel={(tag, { context }) =>
        context === 'menu' ? (
          <div className={s.option}>
            <span className={s.optionLabel}>{tag.label}</span>
            <span className={s.optionDescription}>{tag.description}</span>
          </div>
        ) : (
          tag.label
        )
      }
      classNamePrefix="ai-app-tags"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 42,
          borderRadius: 8,
          borderColor: state.isFocused ? '#1b4dff' : 'rgba(27, 56, 96, 0.12)',
          boxShadow: 'none',
          fontSize: 14,
          '&:hover': { borderColor: state.isFocused ? '#1b4dff' : 'rgba(27, 56, 96, 0.12)' },
        }),
        multiValue: (base) => ({ ...base, borderRadius: 999, backgroundColor: 'rgba(14, 15, 17, 0.04)' }),
        multiValueLabel: (base) => ({ ...base, fontSize: 12, fontWeight: 500, color: '#455468', padding: '2px 6px' }),
        multiValueRemove: (base) => ({ ...base, borderRadius: 999 }),
        option: (base, state) => ({
          ...base,
          padding: '8px 12px',
          backgroundColor: state.isSelected ? '#f1f5f9' : state.isFocused ? '#f8fafc' : '#ffffff',
          color: '#0f172a',
          opacity: state.isDisabled ? 0.5 : 1,
          cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        }),
        menu: (base) => ({ ...base, zIndex: 10 }),
      }}
    />
  );
}
