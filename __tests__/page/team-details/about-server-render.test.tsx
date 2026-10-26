/**
 * @jest-environment node
 */
jest.mock('react-quill-new', () => {
  throw new ReferenceError('document is not defined');
});
jest.mock('quill-image-uploader', () => {
  throw new ReferenceError('document is not defined');
});
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

import { renderToString } from 'react-dom/server';

import { About } from '@/components/page/team-details/TeamDetails/components/About/About';
import type { ITeam } from '@/types/teams.types';

it('puts the sanitized About in the server HTML, with no DOM', () => {
  const html = renderToString(
    <About
      about={'<p onclick="steal()">We build <a href="javascript:alert(1)">storage</a>.</p><script>alert(1)</script>'}
      team={{ id: 'team-1', name: 'Acme' } as unknown as ITeam}
      userInfo={undefined}
      hasTeamEditAccess={false}
    />,
  );

  expect(html).toContain('We build <a>storage</a>.');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('onclick');
});
