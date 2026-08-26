/**
 * How a *proposed* position's dates read, before it is a record.
 *
 * **Why not `ExperiencesList`'s formatter.** That one is `format(new Date(item.startDate), 'MMMM yyyy')`,
 * which is correct for the full ISO timestamps the API returns and wrong for the
 * `'YYYY-MM'` a parse hands back: `new Date('2021-03')` is parsed as UTC
 * midnight, so anywhere west of Greenwich it renders as **February**. A row that
 * says the wrong month is worse than one that says nothing, because the person
 * ticks it without noticing.
 *
 * Splitting the string sidesteps the timezone entirely — there is no instant
 * involved in "March 2021", so constructing one can only introduce error.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** 'YYYY-MM' → 'March 2021'. Anything unparseable is passed through unchanged. */
const pretty = (ym: string | null): string => {
  if (!ym) return '';
  const [year, rawMonth] = ym.split('-');
  const month = Number(rawMonth);
  if (!year || !month || month < 1 || month > 12) return ym;
  return `${MONTHS[month - 1]} ${year}`;
};

export function formatParsedDates(entry: { startDate: string; endDate: string | null; isCurrent: boolean }): string {
  const start = pretty(entry.startDate);
  if (entry.isCurrent) return start ? `${start} — Present` : 'Present';

  const end = pretty(entry.endDate);
  if (!start) return end;
  if (!end) return start;
  return `${start} — ${end}`;
}
