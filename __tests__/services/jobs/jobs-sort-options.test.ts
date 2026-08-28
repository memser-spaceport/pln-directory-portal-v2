import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';

const values = JOBS_SORT_OPTIONS.map((o) => o.value);
const labels = JOBS_SORT_OPTIONS.map((o) => o.label);

describe('JOBS_SORT_OPTIONS', () => {
  it('offers both alphabetical directions, not just A-Z', () => {
    expect(values).toContain('company_az');
    expect(values).toContain('company_za');
  });

  it('labels the two directions distinctly, so the dropdown is readable', () => {
    const az = JOBS_SORT_OPTIONS.find((o) => o.value === 'company_az');
    const za = JOBS_SORT_OPTIONS.find((o) => o.value === 'company_za');

    expect(az?.label).toBe('A-Z (Ascending)');
    expect(za?.label).toBe('Z-A (Descending)');
  });

  it('keeps the descending option next to its ascending twin', () => {
    expect(values.indexOf('company_za')).toBe(values.indexOf('company_az') + 1);
  });

  it('has unique values — a duplicate would make the dropdown pick the wrong row', () => {
    expect(new Set(values).size).toBe(values.length);
  });

  it('has unique labels', () => {
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('still offers Newest alongside the alphabetical pair', () => {
    expect(values).toContain('newest');
  });
});
