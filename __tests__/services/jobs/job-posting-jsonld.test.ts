import { buildJobPostingJsonLd, jobDescriptionHtml } from '@/services/jobs/job-posting-jsonld';
import type { IJobPay, IJobRole, IJobTeam } from '@/types/jobs.types';

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
    expect(jsonLd.validThrough).toBe('2026-07-30T00:00:00.000Z');
    expect(jsonLd.employmentType).toBe('FULL_TIME');
    expect(jsonLd.baseSalary).toBeUndefined();
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
    expect(build({ postedDate: null }).validThrough).toBe('2026-06-30T00:00:00.000Z');
    expect(build({ postedDate: null, detectionDate: null }).datePosted).toBe('2026-05-02T00:00:00.000Z');
    expect(build({ postedDate: null, detectionDate: null }).validThrough).toBe('2026-07-31T00:00:00.000Z');
  });

  it('emits the public pay range as baseSalary', () => {
    const pay = (period: IJobPay['period'], min: number, max: number): IJobPay => ({
      min,
      max,
      currency: 'USD',
      period,
    });

    expect(build({ pay: pay('year', 180000, 220000), workMode: 'in-office' }).baseSalary).toEqual({
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: 180000,
        maxValue: 220000,
        unitText: 'YEAR',
      },
    });
    expect(build({ pay: pay('month', 10000, 12000) }).baseSalary).toMatchObject({
      value: { minValue: 10000, maxValue: 12000, unitText: 'MONTH' },
    });
    expect(build({ pay: pay('hour', 40, 60) }).baseSalary).toMatchObject({
      value: { minValue: 40, maxValue: 60, unitText: 'HOUR' },
    });
    expect(build({ pay: pay('year', 180000, 220000), workMode: 'hybrid' }).employmentType).toBe('FULL_TIME');
  });

  it('omits baseSalary when pay is absent or the period is not a known unit', () => {
    expect(build({ pay: null }).baseSalary).toBeUndefined();
    expect(
      build({ pay: { min: 1, max: 2, currency: 'USD', period: 'week' as IJobPay['period'] } }).baseSalary,
    ).toBeUndefined();
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
