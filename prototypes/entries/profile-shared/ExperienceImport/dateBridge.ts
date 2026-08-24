/**
 * `MonthYearSelect` speaks full ISO ("2021-03-01T00:00:00.000Z"); the profile
 * record keeps 'YYYY-MM'. Translating at this one boundary keeps the stored
 * value readable and keeps the control production's, unmodified.
 *
 * Lives here rather than in each consumer because there are now two places that
 * mount that control against this record — the section's own form and the import
 * review — and two copies of a date bridge is two chances for one of them to
 * start rounding differently.
 */

export const ymToIso = (ym: string | null): string | null => {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  if (!y || !m) return null;
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1)).toISOString();
};

export const isoToYm = (iso: string | null): string | null => (iso ? iso.slice(0, 7) : null);
