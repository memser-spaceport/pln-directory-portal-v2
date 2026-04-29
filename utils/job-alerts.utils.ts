import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';
import { seniorityDisplayLabel } from '@/utils/jobs.utils';
import { workplaceTypesToWorkModes } from '@/utils/jobs-api-query';

const FILTER_KEYS = ['roleCategory', 'seniority', 'focus', 'location', 'workMode'] as const;

const readMulti = (sp: URLSearchParams, key: string): string[] => {
  const direct = sp.getAll(key).map((v) => v.trim()).filter(Boolean);
  if (direct.length > 1) return direct;
  if (direct.length === 1 && direct[0].includes('|')) {
    return direct[0]
      .split('|')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return direct;
};

const workModesToWorkplaceTypes = (modes: string[]): string[] => {
  const out = new Set<string>();
  for (const m of modes) {
    if (m === 'remote' || m === 'distributed') out.add('remote');
    else if (m === 'hybrid') out.add('hybrid');
    else if (m === 'in-office') out.add('in-office');
  }
  return [...out];
};

export const jobAlertFilterStateFromURL = (
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): IJobAlertFilterState => {
  const sp = searchParams as URLSearchParams;
  const q = sp.get('q')?.trim();
  return {
    q: q || undefined,
    roleCategory: readMulti(sp, 'roleCategory'),
    seniority: readMulti(sp, 'seniority'),
    focus: readMulti(sp, 'focus'),
    location: readMulti(sp, 'location'),
    workMode: workplaceTypesToWorkModes(readMulti(sp, 'workplaceType')),
  };
};

export const hasActiveFilters = (state: IJobAlertFilterState): boolean => {
  if (state.q && state.q.length > 0) return true;
  return FILTER_KEYS.some((k) => state[k].length > 0);
};

export const filterStateToHashKey = (state: IJobAlertFilterState): string => {
  const parts: string[] = [];
  if (state.q) parts.push(`q=${state.q.toLowerCase()}`);
  for (const key of FILTER_KEYS) {
    const sorted = [...state[key]].map((v) => v.toLowerCase()).sort();
    if (sorted.length > 0) parts.push(`${key}=${sorted.join(',')}`);
  }
  return parts.join('&');
};

export const summarizeFilterState = (state: IJobAlertFilterState): string => {
  const parts: string[] = [];
  if (state.roleCategory.length) parts.push(state.roleCategory.join(', '));
  if (state.seniority.length) parts.push(state.seniority.map(seniorityDisplayLabel).join(', '));
  if (state.focus.length) parts.push(state.focus.join(', '));
  if (state.location.length) parts.push(state.location.join(', '));
  if (state.workMode.length) parts.push(state.workMode.join(', '));
  if (state.q) parts.push(`"${state.q}"`);
  return parts.join(' · ') || 'Job alert';
};

export const filterStateToURLSearchParams = (state: IJobAlertFilterState): URLSearchParams => {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  for (const key of ['roleCategory', 'seniority', 'focus', 'location'] as const) {
    if (state[key].length > 0) params.set(key, state[key].join('|'));
  }
  const workplaceTypes = workModesToWorkplaceTypes(state.workMode);
  if (workplaceTypes.length > 0) params.set('workplaceType', workplaceTypes.join('|'));
  return params;
};
