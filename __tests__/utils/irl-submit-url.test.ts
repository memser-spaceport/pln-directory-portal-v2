import { getSubmitEventUrl } from '@/utils/irl-submit-url';

describe('getSubmitEventUrl', () => {
  it.each([
    ['https://irl.os.pl.xyz/events'],
    ['https://irl.os.pl.xyz/events/'],
    ['https://irl.os.pl.xyz'],
    ['https://irl.os.pl.xyz/'],
  ])('builds the LabOS sign-in start link from %s', (base) => {
    expect(getSubmitEventUrl(base)).toBe('https://irl.os.pl.xyz/auth/labos?returnUrl=%2Fevents%2Fadd');
  });

  it('keeps the dev host', () => {
    expect(getSubmitEventUrl('https://submitv2.events.dev.os.pl.xyz/events')).toBe(
      'https://submitv2.events.dev.os.pl.xyz/auth/labos?returnUrl=%2Fevents%2Fadd'
    );
  });

  it('falls back to the old link when the base is not a URL', () => {
    expect(getSubmitEventUrl('not a url')).toBe('not a url/add');
  });
});
