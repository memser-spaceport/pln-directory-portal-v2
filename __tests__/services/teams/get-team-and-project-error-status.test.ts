/**
 * @jest-environment node
 */
/**
 * LAB-2922: a profile page answers a real 404 only when the API says the id is unknown, so the team and project
 * lookups must carry the API's status on their error, not just its text.
 */
import { getTeam } from '@/services/teams.service';
import { getProject } from '@/services/projects.service';

const respond = (status: number, body: string) => {
  global.fetch = jest
    .fn()
    .mockResolvedValue(
      new Response(body, { status, statusText: status === 404 ? 'Not Found' : 'Service Unavailable' }),
    ) as unknown as typeof fetch;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each([
  ['getTeam', () => getTeam('doesnotexist', {})],
  ['getProject', () => getProject('doesnotexist', {})],
])('%s', (_name, lookup) => {
  it('returns status 404 for an unknown id', async () => {
    respond(404, JSON.stringify({ statusCode: 404, error: 'Not Found' }));

    await expect(lookup()).resolves.toEqual({ error: { status: 404, statusText: 'Not Found' } });
  });

  it('returns the 5xx status for an outage, with a body that is not JSON', async () => {
    respond(503, '<html>Service Unavailable</html>');

    await expect(lookup()).resolves.toEqual({ error: { status: 503, statusText: 'Service Unavailable' } });
  });
});

describe('getTeam', () => {
  /* LAB-3087: the profile tells an `L0` team (hidden from logged-out visitors) from other refusals by the message. */
  it("keeps the API's message, so a hidden team can be told apart", async () => {
    respond(403, JSON.stringify({ statusCode: 403, message: 'Team is inactive' }));

    await expect(getTeam('l0team', {})).resolves.toEqual({
      error: { status: 403, statusText: 'Service Unavailable', message: 'Team is inactive' },
    });
  });
});
