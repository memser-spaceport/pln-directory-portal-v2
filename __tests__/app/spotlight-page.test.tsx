/**
 * LAB-2980: team text in the spotlight page JSON-LD cannot end the script element or inject markup.
 */
const mockGetAccess = jest.fn();
jest.mock('@/services/team-pitch/team-pitch-access.server', () => ({
  getTeamPitchAccessServer: (slug: string) => mockGetAccess(slug),
}));
jest.mock('@/components/page/pitch/PitchView', () => ({ PitchView: () => null }));
jest.mock('@/components/page/pitch/PitchViewSkeleton', () => ({ PitchViewSkeleton: () => null }));

import { render } from '@testing-library/react';
import SpotlightPage from '@/app/spotlight/[slug]/page';

const params = Promise.resolve({ slug: 'acme' });
const HOSTILE = '</script><script>alert(1)</script> <!-- & \u2028 end';

const ACCESS = {
  uid: 'pitch-1',
  slug: 'acme',
  createdAt: '2026-10-01T00:00:00.000Z',
  title: `Title ${HOSTILE}`,
  description: `Description ${HOSTILE}`,
  spotlightFrequency: 'WEEKLY',
  spotlightStatement: `Statement ${HOSTILE}`,
  supportEmail: 'support@example.com',
  logoUrl: null,
  primaryColor: '#000',
  headerImageUrl: null,
  access: 'view',
  participantAccess: null,
  participantType: null,
  isPitchAdmin: false,
  confidentialityAccepted: false,
  teamUid: 'team-1',
  teamName: `Acme ${HOSTILE}`,
};

async function renderJsonLd(access: object) {
  mockGetAccess.mockResolvedValue(access);
  const { container } = render(await SpotlightPage({ params }));
  return container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? '';
}

describe('spotlight page structured data', () => {
  it.each([
    ['OPEN', 'Event', 'organizer'],
    ['CLOSED', 'WebPage', 'about'],
    ['DRAFT', 'WebPage', 'about'],
  ] as const)('escapes team text for status %s (%s)', async (status, type, orgKey) => {
    const script = await renderJsonLd({ ...ACCESS, status });

    expect(script).not.toContain('</script>');
    expect(script).not.toMatch(/[<>&\u2028\u2029]/);

    const data = JSON.parse(script);
    expect(data['@type']).toBe(type);
    expect(data.name).toBe(ACCESS.title);
    expect(data.description).toBe(ACCESS.description);
    expect(data[orgKey].name).toBe(ACCESS.teamName);
  });

  it('escapes the spotlight statement when there is no description', async () => {
    const script = await renderJsonLd({ ...ACCESS, status: 'OPEN', description: '' });

    expect(script).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(script).description).toBe(ACCESS.spotlightStatement);
  });

  it('renders no structured data when the spotlight is not found', async () => {
    expect(await renderJsonLd(null as unknown as object)).toBe('');
  });
});
