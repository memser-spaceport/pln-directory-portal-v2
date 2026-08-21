import {
  MIN_FOUNDED_YEAR,
  editTeamDetailsSchema,
} from '@/components/page/team-details/TeamDetails/components/EditTeamDetailsForm/helpers';

const CURRENT_YEAR = new Date().getFullYear();

/** Validates one field in isolation — the rest of the form isn't the subject here. */
async function validateField(field: 'dateFounded' | 'teamSize', value: string) {
  try {
    await editTeamDetailsSchema.validateAt(field, { [field]: value });
    return null;
  } catch (error) {
    return (error as { message: string }).message;
  }
}

describe('editTeamDetailsSchema — dateFounded', () => {
  it('accepts a 4-digit year in range', async () => {
    await expect(validateField('dateFounded', '2014')).resolves.toBeNull();
    await expect(validateField('dateFounded', String(MIN_FOUNDED_YEAR))).resolves.toBeNull();
    await expect(validateField('dateFounded', String(CURRENT_YEAR))).resolves.toBeNull();
  });

  it('accepts an empty value — the field is optional', async () => {
    await expect(validateField('dateFounded', '')).resolves.toBeNull();
  });

  it('rejects anything that is not exactly 4 digits', async () => {
    await expect(validateField('dateFounded', '20')).resolves.toMatch(/4-digit year/);
    await expect(validateField('dateFounded', '20144')).resolves.toMatch(/4-digit year/);
    await expect(validateField('dateFounded', 'abcd')).resolves.toMatch(/4-digit year/);
    await expect(validateField('dateFounded', '20a4')).resolves.toMatch(/4-digit year/);
  });

  it('rejects a year in the future', async () => {
    await expect(validateField('dateFounded', String(CURRENT_YEAR + 1))).resolves.toMatch(/between/);
    await expect(validateField('dateFounded', '9999')).resolves.toMatch(/between/);
  });

  it('rejects an implausibly early year', async () => {
    await expect(validateField('dateFounded', '0201')).resolves.toMatch(/between/);
    await expect(validateField('dateFounded', String(MIN_FOUNDED_YEAR - 1))).resolves.toMatch(/between/);
  });
});

describe('editTeamDetailsSchema — teamSize', () => {
  it('accepts a count, a range, or an open-ended label', async () => {
    await expect(validateField('teamSize', '50')).resolves.toBeNull();
    await expect(validateField('teamSize', '11-50')).resolves.toBeNull();
    await expect(validateField('teamSize', '201 – 500')).resolves.toBeNull();
    await expect(validateField('teamSize', '500+')).resolves.toBeNull();
    await expect(validateField('teamSize', '')).resolves.toBeNull();
  });

  it('rejects free text', async () => {
    await expect(validateField('teamSize', 'a lot')).resolves.toMatch(/number/);
    await expect(validateField('teamSize', '11 to 50')).resolves.toMatch(/number/);
  });
});
