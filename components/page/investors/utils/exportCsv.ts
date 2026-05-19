import type { OutreachInvestor } from '@/services/investors/types';

/**
 * Serialize a value for CSV: quote if it contains comma / quote / newline,
 * arrays joined with semicolon (so they survive a single CSV cell).
 */
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

/**
 * Build a CSV blob and trigger a browser download.
 *
 * @param investors Rows to export.
 * @param visibleColumns Column ids to include (in order). Synthetic "name" expands
 *                       to first_name + last_name. Unknown ids are skipped.
 * @param filename     Desired download filename (must end in .csv).
 */
export function exportInvestorsCsv(investors: OutreachInvestor[], visibleColumns: string[], filename: string): void {
  if (investors.length === 0) return;

  // Map synthetic name → both first_name and last_name; otherwise pass-through
  const colSpec: Array<{ key: string; header: string; getter: (i: OutreachInvestor) => unknown }> = [];
  for (const col of visibleColumns) {
    if (col === 'name') {
      colSpec.push({ key: 'first_name', header: 'first_name', getter: (i) => i.first_name });
      colSpec.push({ key: 'last_name', header: 'last_name', getter: (i) => i.last_name });
    } else if (col === 'lab_os_profile') {
      colSpec.push({
        key: 'lab_os_profile_uid',
        header: 'lab_os_profile_uid',
        getter: (i) => i.lab_os_profile?.uid ?? '',
      });
      colSpec.push({
        key: 'lab_os_profile_type',
        header: 'lab_os_profile_type',
        getter: (i) => i.lab_os_profile?.type ?? '',
      });
    } else {
      colSpec.push({
        key: col,
        header: col,
        getter: (i) => (i as unknown as Record<string, unknown>)[col],
      });
    }
  }

  const lines = [colSpec.map((c) => csvCell(c.header)).join(',')];
  for (const inv of investors) {
    lines.push(colSpec.map((c) => csvCell(c.getter(inv))).join(','));
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
