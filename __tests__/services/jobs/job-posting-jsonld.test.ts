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
    const jsonLd = buildJobPostingJsonLd({
      role: role(),
      team,
      pageUrl: 'https://os.pl.xyz/jobs/openings/role-1',
      descriptionHtml,
    });

    expect(jsonLd['@type']).toBe('JobPosting');
    expect(jsonLd.title).toBe('Protocol Engineer');
    expect(jsonLd.url).toBe('https://os.pl.xyz/jobs/openings/role-1');
    expect(jsonLd.datePosted).toBe('2026-05-01T00:00:00.000Z');
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.hiringOrganization).toEqual({
      '@type': 'Organization',
      name: 'Protocol Labs',
      sameAs: 'https://os.pl.xyz/teams/team-1',
      logo: 'https://cdn.test/logo.png',
    });
    expect(jsonLd.identifier).toEqual({ '@type': 'PropertyValue', name: 'uid', value: 'role-1' });
    expect(jsonLd.description).toBe('<p>Build the network.</p>');
  });

  it('omits TELECOMMUTE and jobLocation when neither remote nor a place is known', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    const jsonLd = buildJobPostingJsonLd({
      role: role({ workMode: 'in-office', location: [] }),
      team,
      pageUrl: 'https://os.pl.xyz/jobs/openings/role-1',
      descriptionHtml: '',
    });
    expect(jsonLd.jobLocationType).toBeUndefined();
    expect(jsonLd.jobLocation).toBeUndefined();
    expect(jsonLd.description).toBe('Protocol Engineer');
  });
});
