import type { WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (Array.isArray(value)) str = value.join('; ');
  else if (typeof value === 'object') str = JSON.stringify(value);
  else str = String(value);
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const COLUMNS: Array<{ header: string; getter: (row: WarmIntrosV2PathListItem) => unknown }> = [
  { header: 'name', getter: (r) => r.investor?.name ?? '' },
  { header: 'email', getter: (r) => r.investor?.email ?? '' },
  { header: 'org', getter: (r) => r.investor?.currentOrg ?? '' },
  { header: 'title', getter: (r) => r.investor?.currentTitle ?? '' },
  { header: 'sectors', getter: (r) => r.investor?.sectors ?? [] },
  { header: 'proximityCode', getter: (r) => r.proximityCode ?? '' },
  { header: 'caliber', getter: (r) => r.caliber ?? '' },
  { header: 'scorePercent', getter: (r) => r.scorePercent },
  { header: 'bestConnector', getter: (r) => r.bestConnector?.name ?? '' },
  { header: 'pathExplanation', getter: (r) => r.pathSummary?.explanation ?? '' },
  { header: 'targetSet', getter: (r) => r.targetSet },
  { header: 'affinityPersonId', getter: (r) => r.investor?.affinityPersonId ?? '' },
];

/** Build a CSV blob and trigger a browser download for Warm Intros v2 path rows. */
export function exportWarmIntrosV2Csv(rows: WarmIntrosV2PathListItem[], filename: string): void {
  if (rows.length === 0) return;

  const lines = [COLUMNS.map((c) => csvCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => csvCell(c.getter(row))).join(','));
  }
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
