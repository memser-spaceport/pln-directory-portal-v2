import { buildJobPostingJsonLd, jobDescriptionHtml } from '@/services/jobs/job-posting-jsonld';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';

const role = (overrides: Partial<IJobRole> = {}): IJobRole => ({
  uid: 'role-1',
  roleTitle: 'Protocol Engineer',
  roleCategory: 'Engineering',
  seniority: 'Senior (L4)',
  location: ['Remote', 'Berlin'],
  workMode: 'remote',
  applyUrl: null,
  descriptionHtml: '<p>Build the network.</p><script>alert(1)</script>',
  lastUpdated: '2026-05-02T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: '2026-04-01T00:00:00.000Z',
  ...overrides,
});

const team: IJobTeam = {
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: 'https://cdn.test/logo.png',
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

const build = (overrides: Partial<IJobRole> = {}, descriptionHtml = '') =>
  buildJobPostingJsonLd({
    role: role(overrides),
    team,
    pageUrl: 'https://os.pl.xyz/jobs/openings/role-1',
    descriptionHtml,
  });

describe('jobDescriptionHtml', () => {
  it('sanitizes ingest markup', () => {
    expect(jobDescriptionHtml('<p>Hi<script>x</script></p>')).toBe('<p>Hi</p>');
  });

  it('returns empty when sanitizing leaves nothing visible', () => {
    expect(jobDescriptionHtml('<script>alert(1)</script>')).toBe('');
  });
});

describe('buildJobPostingJsonLd', () => {
  const original = process.env.APPLICATION_BASE_URL;

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  it('emits JobPosting fields from real role data', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    const descriptionHtml = jobDescriptionHtml(role().descriptionHtml);
    const jsonLd = build({}, descriptionHtml);

    expect(jsonLd['@type']).toBe('JobPosting');
    expect(jsonLd.title).toBe('Protocol Engineer');
    expect(jsonLd.url).toBe('https://os.pl.xyz/jobs/openings/role-1');
    expect(jsonLd.datePosted).toBe('2026-05-01T00:00:00.000Z');
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'Worldwide' });
    expect(jsonLd.jobLocation).toEqual([
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Berlin' },
      },
    ]);
    expect(jsonLd.hiringOrganization).toEqual({
      '@type': 'Organization',
      name: 'Protocol Labs',
      sameAs: 'https://os.pl.xyz/teams/team-1',
      logo: 'https://cdn.test/logo.png',
    });
    expect(jsonLd.identifier).toEqual({ '@type': 'PropertyValue', name: 'uid', value: 'role-1' });
    expect(jsonLd.description).toBe('<p>Build the network.</p>');
  });

  it('treats a role with no place as remote so Google still qualifies it', () => {
    const jsonLd = build({ workMode: 'in-office', location: [] });
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'Worldwide' });
    expect(jsonLd.jobLocation).toBeUndefined();
    expect(jsonLd.datePosted).toBe('2026-05-01T00:00:00.000Z');
    expect(jsonLd.description).toBe('Protocol Engineer');
  });

  it('marks distributed and location-token remote roles as TELECOMMUTE', () => {
    expect(build({ workMode: 'distributed', location: [] }).jobLocationType).toBe('TELECOMMUTE');
    expect(build({ workMode: null, location: ['Remote'] }).jobLocationType).toBe('TELECOMMUTE');
  });

  it('falls back to detectionDate then lastUpdated when postedDate is empty', () => {
    expect(build({ postedDate: null }).datePosted).toBe('2026-04-01T00:00:00.000Z');
    expect(build({ postedDate: null, detectionDate: null }).datePosted).toBe('2026-05-02T00:00:00.000Z');
  });

  it('emits a physical jobLocation without TELECOMMUTE for in-office roles', () => {
    const jsonLd = build({ workMode: 'in-office', location: ['Berlin'] });
    expect(jsonLd.jobLocationType).toBeUndefined();
    expect(jsonLd.applicantLocationRequirements).toBeUndefined();
    expect(jsonLd.jobLocation).toEqual([
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Berlin' },
      },
    ]);
  });

  it('parses country from city, state and country location strings', () => {
    const jsonLd = build({ workMode: 'in-office', location: ['San Francisco, CA', 'Lisbon, Portugal'] });
    expect(jsonLd.jobLocation).toEqual([
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'San Francisco', addressCountry: 'US' },
      },
      {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Lisbon', addressCountry: 'PT' },
      },
    ]);
  });

  it('uses a country location as applicantLocationRequirements when the role is remote', () => {
    const jsonLd = build({ workMode: 'remote', location: ['US'] });
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.jobLocation).toBeUndefined();
    expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'US' });
  });
});
