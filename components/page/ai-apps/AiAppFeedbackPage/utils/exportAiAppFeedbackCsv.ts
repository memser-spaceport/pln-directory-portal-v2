import { AI_APP_FEEDBACK_STATUS_LABELS } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

/**
 * Serialize a value for CSV: quote if it contains comma / quote / newline.
 * Mirrors components/page/investors/utils/exportCsv.ts's csvCell().
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Flatten stored Quill HTML for spreadsheets: keep image URLs, drop the rest of the markup. */
export function htmlToPlainText(value: string): string {
  if (!/^\s*</.test(value)) {
    return value;
  }

  return value
    .replace(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const COLUMNS: Array<{ header: string; getter: (row: AiAppFeedbackRow) => unknown }> = [
  { header: 'app_name', getter: (row) => row.appName },
  { header: 'feedback', getter: (row) => htmlToPlainText(row.text) },
  { header: 'submitter', getter: (row) => row.member?.name ?? 'Unknown member' },
  { header: 'status', getter: (row) => AI_APP_FEEDBACK_STATUS_LABELS[row.status] },
  { header: 'date', getter: (row) => row.createdAt },
];

/** Build a CSV blob and trigger a browser download for the currently loaded/filtered feedback rows. */
export function exportAiAppFeedbackCsv(rows: AiAppFeedbackRow[], filename: string): void {
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
