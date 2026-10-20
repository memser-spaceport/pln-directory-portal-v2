import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { EVENTS_REDIRECTS } from '@/utils/events-redirects';

/** Resolves a pathname through the redirect list the way Next.js does: first matching source wins. */
const redirectFor = (pathname: string) => {
  const rule = EVENTS_REDIRECTS.find(({ source }) => getPathMatch(source, { removeUnnamedParams: true })(pathname));
  return rule ? { destination: rule.destination, permanent: rule.permanent } : null;
};

describe('LAB-2924: /events is one address for Google, not two', () => {
  it('redirects /events permanently to the calendar', () => {
    expect(redirectFor('/events')).toEqual({ destination: '/events/all', permanent: true });
  });

  it.each(['/events/all', '/events/irl', '/events/irl/some-gathering', '/events/contributors'])(
    'leaves %s alone',
    (pathname) => {
      expect(redirectFor(pathname)).toBeNull();
    },
  );
});
