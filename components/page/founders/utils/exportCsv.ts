import type { FounderItem } from '@/services/founders/types';
import { founderHeadline, getFundTag } from '@/services/founders/types';

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

type ColSpec = { header: string; getter: (f: FounderItem) => unknown };

function buildColSpec(visibleColumns: string[]): ColSpec[] {
  const spec: ColSpec[] = [];
  for (const col of visibleColumns) {
    switch (col) {
      case 'name':
        spec.push({ header: 'headline', getter: (f) => founderHeadline(f) ?? '' });
        spec.push({ header: 'name', getter: (f) => f.name });
        spec.push({ header: 'pedigree', getter: (f) => f.pedigree ?? f.rawPayload?.pedigree ?? '' });
        break;
      case 'fundTags':
        spec.push({
          header: 'fund_tags',
          getter: (f) =>
            (f.rawPayload?.fund_tags ?? [])
              .map((t) => getFundTag(t))
              .filter(Boolean)
              .join('; '),
        });
        break;
      case 'sources':
        spec.push({ header: 'sources', getter: (f) => (f.sources ?? []).join('; ') });
        break;
      case 'reviewState':
        spec.push({ header: 'review_status', getter: (f) => f.reviewState.status });
        break;
      default:
        break;
    }
  }
  return spec;
}

export function exportFoundersCsv(founders: FounderItem[], visibleColumns: string[]): void {
  const cols = buildColSpec(visibleColumns);
  if (cols.length === 0) return;

  const header = cols.map((c) => csvCell(c.header)).join(',');
  const rows = founders.map((f) => cols.map((c) => csvCell(c.getter(f))).join(','));
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `founders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
