/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { proxy } from '@/proxy';

jest.mock('@/services/auth.service', () => ({
  checkIsValidToken: jest.fn(),
  renewAccessToken: jest.fn(),
}));

jest.mock('@/utils/auth.utils', () => ({
  calculateExpiry: jest.fn(),
  decodeToken: jest.fn(),
}));

const ORIGIN = 'https://os.pl.xyz';

async function run(path: string) {
  const res = await proxy(new NextRequest(`${ORIGIN}${path}`));
  const location = res?.headers.get('location');
  return { status: res?.status, location: location ? new URL(location) : null };
}

describe('proxy: legacy AI App ?path= deep links', () => {
  it('redirects /pl-infra-os?path= to the segment URL', async () => {
    const { status, location } = await run('/pl-infra-os?path=%2Fflywheels');

    expect(status).toBe(308);
    expect(location?.pathname).toBe('/pl-infra-os/flywheels');
    expect(location?.search).toBe('');
  });

  it('redirects an app detail link and keeps the other params', async () => {
    const { status, location } = await run('/pl-infra/ai-apps/app-1?path=%2Freports%2F42&settings=deployment');

    expect(status).toBe(308);
    expect(location?.pathname).toBe('/pl-infra/ai-apps/app-1/reports/42');
    expect(location?.search).toBe('?settings=deployment');
  });

  it('keeps only the pathname of the legacy value', async () => {
    const { location } = await run('/pl-infra-os?path=%2Freports%3Ftab%3Dx%23f');

    expect(location?.pathname).toBe('/pl-infra-os/reports');
    expect(location?.search).toBe('');
    expect(location?.hash).toBe('');
  });

  it('drops a trailing slash so the redirect is a single hop', async () => {
    const { location } = await run('/pl-infra-os?path=%2Fflywheels%2F');

    expect(location?.pathname).toBe('/pl-infra-os/flywheels');
  });

  it.each(['//evil.com/x', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/', ''])(
    'lands on the bare app route for a value that is not a same-origin path (%s)',
    async (path) => {
      const params = new URLSearchParams({ path, settings: 'deployment' });
      const { status, location } = await run(`/pl-infra-os?${params}`);

      expect(status).toBe(308);
      expect(location?.pathname).toBe('/pl-infra-os');
      expect(location?.search).toBe('?settings=deployment');
    },
  );

  it('sends a signed-out segment URL to login with the subpage in the backlink, without looping', async () => {
    const { status, location } = await run('/pl-infra-os/flywheels?settings=deployment');

    expect(status).toBe(307);
    expect(location?.pathname).toBe('/members');
    expect(location?.searchParams.get('backlink')).toBe('/pl-infra-os/flywheels?settings=deployment');
    expect(location?.hash).toBe('#login');
  });

  it('leaves ?path= alone outside the app detail routes', async () => {
    const { status, location } = await run('/pl-infra/ai-apps/app-1/prd?path=%2Fx');

    expect(status).toBe(307);
    expect(location?.pathname).toBe('/members');
  });
});
