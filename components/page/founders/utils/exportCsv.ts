import type { FounderItem } from '@/services/founders/types';
import { getFundTag } from '@/services/founders/types';

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
        spec.push({ header: 'name', getter: (f) => f.name });
        spec.push({ header: 'why_now', getter: (f) => f.whyNow ?? '' });
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
      case 'alignmentMax':
        spec.push({ header: 'alignment_max', getter: (f) => f.alignmentMax ?? '' });
        break;
      case 'plvsScore':
        spec.push({ header: 'plvs_score', getter: (f) => f.plvsScore ?? '' });
        break;
      case 'sources':
        spec.push({ header: 'sources', getter: (f) => (f.sources ?? []).join('; ') });
        break;
      case 'reviewState':
        spec.push({ header: 'review_status', getter: (f) => f.reviewState?.status ?? '' });
        spec.push({ header: 'review_feedback', getter: (f) => f.reviewState?.feedback ?? '' });
        break;
    }
  }
  return spec;
}

export function exportFoundersCsv(founders: FounderItem[], visibleColumns: string[], filename: string): void {
  if (founders.length === 0) return;

  // Always export name even if the column chooser somehow hides it
  const cols = visibleColumns.includes('name') ? visibleColumns : ['name', ...visibleColumns];
  const spec = buildColSpec(cols);

  const lines = [spec.map((c) => csvCell(c.header)).join(',')];
  for (const founder of founders) {
    lines.push(spec.map((c) => csvCell(c.getter(founder))).join(','));
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
