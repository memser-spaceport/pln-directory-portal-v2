import { DEFAULT_VISIBLE_COLUMNS, FOUNDER_COLUMNS } from '@/services/founders/constants';

/**
 * The two arrays are maintained by hand and read by different code — the column
 * picker walks FOUNDER_COLUMNS, the table filters rows against
 * DEFAULT_VISIBLE_COLUMNS. A key in one and not the other fails silently: the
 * column just never appears, with no error anywhere.
 */

const keys = FOUNDER_COLUMNS.map((c) => c.key);

describe('FOUNDER_COLUMNS', () => {
  it('has no duplicate keys', () => {
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every column a non-empty label for the picker', () => {
    FOUNDER_COLUMNS.forEach((column) => expect(column.label).toEqual(expect.stringMatching(/\S/)));
  });

  it('carries the PLN Proximity column, labelled for the header', () => {
    expect(FOUNDER_COLUMNS).toContainEqual(expect.objectContaining({ key: 'plnProximity', label: 'PLN Proximity' }));
  });
});

describe('DEFAULT_VISIBLE_COLUMNS', () => {
  it('names only columns that actually exist', () => {
    DEFAULT_VISIBLE_COLUMNS.forEach((key) => expect(keys).toContain(key));
  });

  it('has no duplicates', () => {
    expect(new Set(DEFAULT_VISIBLE_COLUMNS).size).toBe(DEFAULT_VISIBLE_COLUMNS.length);
  });

  it('includes name, which the table force-renders regardless', () => {
    expect(DEFAULT_VISIBLE_COLUMNS).toContain('name');
  });

  it('shows PLN Proximity by default — the column was added to be seen', () => {
    expect(DEFAULT_VISIBLE_COLUMNS).toContain('plnProximity');
  });

  it('keeps Status last, so the review action stays at the end of the row', () => {
    expect(DEFAULT_VISIBLE_COLUMNS.at(-1)).toBe('reviewState');
    expect(keys.at(-1)).toBe('reviewState');
  });

  it('follows the declared column order, so the picker and the table agree', () => {
    const declaredOrder = keys.filter((key) => DEFAULT_VISIBLE_COLUMNS.includes(key));

    expect(DEFAULT_VISIBLE_COLUMNS).toEqual(declaredOrder);
  });
});
