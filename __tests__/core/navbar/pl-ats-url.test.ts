import { getPlAtsUrl, PL_ATS_PROD_URL } from '@/components/core/navbar/constants/navLinks';

/**
 * LAB-2711: the PL ATS link must follow the environment (dev opens the dev ATS),
 * read from NEXT_PUBLIC_PL_ATS_URL, and fall back to production when unset.
 */
describe('getPlAtsUrl', () => {
  const original = process.env.NEXT_PUBLIC_PL_ATS_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PL_ATS_URL;
    } else {
      process.env.NEXT_PUBLIC_PL_ATS_URL = original;
    }
  });

  it('opens the dev ATS when the variable is set to the dev host', () => {
    process.env.NEXT_PUBLIC_PL_ATS_URL = 'https://ats.dev.os.pl.xyz';

    expect(getPlAtsUrl()).toBe('https://ats.dev.os.pl.xyz');
  });

  it('opens the production ATS when the variable is set to the prod host', () => {
    process.env.NEXT_PUBLIC_PL_ATS_URL = 'https://ats.os.pl.xyz';

    expect(getPlAtsUrl()).toBe('https://ats.os.pl.xyz');
  });

  it('falls back to the production ATS when the variable is unset', () => {
    delete process.env.NEXT_PUBLIC_PL_ATS_URL;

    expect(getPlAtsUrl()).toBe('https://ats.os.pl.xyz');
    expect(PL_ATS_PROD_URL).toBe('https://ats.os.pl.xyz');
  });

  it('falls back to the production ATS when the variable is empty or blank', () => {
    process.env.NEXT_PUBLIC_PL_ATS_URL = '';
    expect(getPlAtsUrl()).toBe('https://ats.os.pl.xyz');

    process.env.NEXT_PUBLIC_PL_ATS_URL = '   ';
    expect(getPlAtsUrl()).toBe('https://ats.os.pl.xyz');
  });

  it('ignores surrounding whitespace in the configured value', () => {
    process.env.NEXT_PUBLIC_PL_ATS_URL = '  https://ats.dev.os.pl.xyz \n';

    expect(getPlAtsUrl()).toBe('https://ats.dev.os.pl.xyz');
  });
});
