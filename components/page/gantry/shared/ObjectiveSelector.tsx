'use client';

import { useState } from 'react';
import Select from 'react-select';
import { useAssignGantryItemObjectives } from '@/services/gantry/hooks/useAssignGantryItemObjective';
import type { GantryItem, GantryObjective } from '@/services/gantry/types';
import s from './ObjectiveSelector.module.scss';

interface Props {
  readonly item: GantryItem;
  readonly canCurate: boolean;
  readonly objectives: GantryObjective[];
  readonly isLoadingObjectives: boolean;
}

type SelectOption = { label: string; value: string };

const SELECT_STYLES = {
  control: (base: object) => ({
    ...base,
    borderRadius: '8px',
    border: '1px solid rgba(203, 213, 225, 0.50)',
    boxShadow: 'none',
    fontSize: '14px',
    color: '#455468',
    '&:hover': {
      border: '1px solid #5E718D',
      boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12)',
    },
  }),
  option: (base: object) => ({
    ...base,
    fontSize: '14px',
    color: '#455468',
    '&:hover': { background: 'rgba(27, 56, 96, 0.08)' },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  placeholder: (base: object) => ({ ...base, color: '#CBD5E1', fontSize: '14px' }),
};

export function ObjectiveSelector({ item, canCurate, objectives, isLoadingObjectives }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createError, setCreateError] = useState('');
  const assign = useAssignGantryItemObjectives(item.uid);

  const options: SelectOption[] = objectives.map((o) => ({
    label: `O${o.order} · ${o.title}`,
    value: o.uid,
  }));

  const currentValues: SelectOption[] = (item.objectives ?? []).map((o) => ({
    label: `O${o.order} · ${o.title}`,
    value: o.uid,
  }));

  const handleSelectChange = (selected: readonly SelectOption[] | null) => {
    assign.mutate({ objectiveUids: (selected ?? []).map((o) => o.value) });
  };

  const handleCreateConfirm = () => {
    const title = createTitle.trim();
    if (!title) return;
    setCreateError('');
    assign.mutate(
      {
        objectiveUids: (item.objectives ?? []).map((o) => o.uid),
        titles: [title],
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          setCreateTitle('');
        },
        onError: () => {
          setCreateError('Failed to create objective. Please try again.');
        },
      },
    );
  };

  if (!canCurate) {
    if (!item.objectives?.length) return null;
    return (
      <div className={s.readOnly}>
        <span className={s.readOnlyLabel}>Objectives</span>
        <div className={s.badgeList}>
          {item.objectives.map((o) => (
            <span key={o.uid} className={s.badge}>
              O{o.order} · {o.title}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <span className={s.label}>Objectives</span>

      <Select<SelectOption, true>
        isMulti
        options={options}
        value={currentValues}
        onChange={handleSelectChange}
        isClearable
        isLoading={isLoadingObjectives}
        isDisabled={assign.isPending}
        placeholder="Select objectives..."
        menuPlacement="auto"
        styles={SELECT_STYLES as any}
      />

      {assign.isError && !isCreating && (
        <p className={s.error}>Failed to update objectives. Please try again.</p>
      )}

      {!isCreating ? (
        <button type="button" className={s.createBtn} onClick={() => setIsCreating(true)}>
          + New objective
        </button>
      ) : (
        <div className={s.createForm}>
          <input
            className={s.createInput}
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateConfirm();
              }
              if (e.key === 'Escape') {
                setIsCreating(false);
                setCreateTitle('');
                setCreateError('');
              }
            }}
            placeholder="Objective title..."
            maxLength={150}
            autoFocus
          />
          <div className={s.createMeta}>
            <span className={s.charCount}>{createTitle.length}/150</span>
            {createError && <p className={s.error}>{createError}</p>}
          </div>
          <div className={s.createActions}>
            <button
              type="button"
              className={s.confirmBtn}
              onClick={handleCreateConfirm}
              disabled={!createTitle.trim() || assign.isPending}
            >
              {assign.isPending ? 'Creating…' : 'Create & assign'}
            </button>
            <button
              type="button"
              className={s.cancelBtn}
              onClick={() => {
                setIsCreating(false);
                setCreateTitle('');
                setCreateError('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
