import { getProfileFromURL, getSocialLinkUrl } from '@/utils/common.utils';

/**
 * Mirrors `apps/web-api/src/teams/team-handle-normalizer.spec.ts` in the backend: both sides
 * have to agree on what a Bluesky handle / Crunchbase slug normalizes to, otherwise the value
 * rendered right after a save differs from the value the API stored.
 */
describe('getProfileFromURL — bluesky', () => {
  it('strips a leading @', () => {
    expect(getProfileFromURL('@team.bsky.social', 'bluesky')).toBe('team.bsky.social');
  });

  it('passes through a bare handle unchanged', () => {
    expect(getProfileFromURL('team.bsky.social', 'bluesky')).toBe('team.bsky.social');
  });

  it('extracts the handle from a full profile URL', () => {
    expect(getProfileFromURL('https://bsky.app/profile/team.bsky.social', 'bluesky')).toBe('team.bsky.social');
  });

  it('extracts the handle from a schemeless profile URL', () => {
    expect(getProfileFromURL('bsky.app/profile/team.bsky.social', 'bluesky')).toBe('team.bsky.social');
  });

  it('extracts the handle from a profile URL that kept the @', () => {
    expect(getProfileFromURL('https://bsky.app/profile/@team.bsky.social', 'bluesky')).toBe('team.bsky.social');
  });
});

describe('getProfileFromURL — crunchbase', () => {
  it('passes through a bare slug unchanged', () => {
    expect(getProfileFromURL('protocol-labs', 'crunchbase')).toBe('protocol-labs');
  });

  it('strips an organization/ path prefix', () => {
    expect(getProfileFromURL('organization/protocol-labs', 'crunchbase')).toBe('protocol-labs');
  });

  it('extracts the slug from a full crunchbase.com URL', () => {
    expect(getProfileFromURL('https://www.crunchbase.com/organization/protocol-labs', 'crunchbase')).toBe(
      'protocol-labs',
    );
  });

  it('extracts the slug from a schemeless crunchbase.com URL', () => {
    expect(getProfileFromURL('crunchbase.com/organization/protocol-labs', 'crunchbase')).toBe('protocol-labs');
  });

  it('drops trailing URL noise', () => {
    expect(getProfileFromURL('https://www.crunchbase.com/organization/protocol-labs/people', 'crunchbase')).toBe(
      'protocol-labs',
    );
  });
});

describe('getSocialLinkUrl', () => {
  it('links a bluesky handle to its profile', () => {
    expect(getSocialLinkUrl('team.bsky.social', 'bluesky')).toBe('https://bsky.app/profile/team.bsky.social');
  });

  it('links a crunchbase slug to the organization page', () => {
    expect(getSocialLinkUrl('protocol-labs', 'crunchbase')).toBe(
      'https://www.crunchbase.com/organization/protocol-labs',
    );
  });
});
