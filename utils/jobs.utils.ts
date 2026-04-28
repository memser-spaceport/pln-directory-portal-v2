import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { IJobRole, IJobsFacetItem } from '@/types/jobs.types';

const WORKPLACE_TYPE_LABELS: Record<string, string> = {
  remote: 'Remote',
  'in-office': 'In-Office',
  hybrid: 'Hybrid',
};

export const workplaceTypeDisplayLabel = (raw: string): string => WORKPLACE_TYPE_LABELS[raw] ?? raw;

export const buildWorkplaceTypeFacetItems = (workMode?: IJobsFacetItem[]): IJobsFacetItem[] => {
  const byValue = new Map((workMode ?? []).map((f) => [f.value, f.count]));
  const remote = (byValue.get('remote') ?? 0) + (byValue.get('distributed') ?? 0);
  return [
    { value: 'remote', count: remote },
    { value: 'in-office', count: byValue.get('in-office') ?? 0 },
    { value: 'hybrid', count: byValue.get('hybrid') ?? 0 },
  ];
};

export const getJobDate = (role: IJobRole): string => role.postedDate ?? role.detectionDate ?? role.lastUpdated;

const SENIORITY_DISPLAY: Record<string, string> = {
  'Junior (L1-L2)': 'Junior',
  'Mid (L3)': 'Mid',
  'Senior (L4)': 'Senior',
  'Lead (L5)': 'Lead',
  'Principal+ (L6-L7)': 'Principal+',
};

const SENIORITY_ORDER: string[] = ['Junior (L1-L2)', 'Mid (L3)', 'Senior (L4)', 'Lead (L5)', 'Principal+ (L6-L7)'];

export const seniorityDisplayLabel = (raw: string): string => SENIORITY_DISPLAY[raw] ?? raw;

export const sortSeniorityValues = (items: IJobsFacetItem[]): IJobsFacetItem[] => {
  const indexOf = (v: string) => {
    const i = SENIORITY_ORDER.indexOf(v);
    return i === -1 ? SENIORITY_ORDER.length : i;
  };
  return [...items].sort((a, b) => indexOf(a.value) - indexOf(b.value));
};

export const filterStateFromURL = (searchParams: ReadonlyURLSearchParams | URLSearchParams): Record<string, string> => {
  const out: Record<string, string> = {};
  const sp = searchParams as URLSearchParams;
  for (const key of ['q', 'sort']) {
    const value = sp.get(key);
    if (value) out[key] = value;
  }
  for (const key of ['roleCategory', 'seniority', 'focus', 'location', 'workplaceType']) {
    const values = sp.getAll(key).filter(Boolean);
    if (values.length > 0) out[key] = values.join('|');
  }
  return out;
};

export const formatRelativeDays = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1d';
  if (days < 14) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
};

export const isNew = (iso: string, maxDays = 7): boolean => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return false;
  const days = (Date.now() - then) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= maxDays;
};

export const teamInitials = (name: string): string => {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.join('') || '·';
};
