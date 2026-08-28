/**
 * Renders `Team.dateFounded` for the profile header. The API bounds it to a 4-digit year
 * (`z.number().int().gte(1000).lte(9999)`); anything outside that isn't rendered rather than
 * shown as a broken label.
 */
export function formatFoundedYear(dateFounded: number | string | null | undefined): string | undefined {
  if (dateFounded === null || dateFounded === undefined || dateFounded === '') {
    return undefined;
  }

  const year = Number(dateFounded);
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    return undefined;
  }

  return `Founded ${year}`;
}
