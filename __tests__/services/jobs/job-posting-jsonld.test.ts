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

const buildOrNull = (overrides: Partial<IJobRole> = {}, descriptionHtml = '') =>
  buildJobPostingJsonLd({
    role: role(overrides),
    team,
    pageUrl: 'https://os.pl.xyz/jobs/openings/role-1',
    descriptionHtml,
  });

const build = (overrides: Partial<IJobRole> = {}, descriptionHtml = '') => {
  const jsonLd = buildOrNull(overrides, descriptionHtml);
  if (!jsonLd) throw new Error('expected a JobPosting');
  return jsonLd;
};

const place = (addressCountry: string, addressLocality?: string) => ({
  '@type': 'Place',
  address: { '@type': 'PostalAddress', ...(addressLocality ? { addressLocality } : {}), addressCountry },
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
    expect(jsonLd).not.toHaveProperty('validThrough');
    expect(jsonLd.employmentType).toBe('FULL_TIME');
    expect(jsonLd.baseSalary).toBeUndefined();
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'DE' });
    expect(jsonLd.jobLocation).toEqual([place('DE', 'Berlin')]);
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
    expect(jsonLd.jobLocation).toEqual([place('DE', 'Berlin')]);
  });

  it('parses country from city, state and country location strings', () => {
    const jsonLd = build({ workMode: 'in-office', location: ['San Francisco, CA', 'Lisbon, Portugal'] });
    expect(jsonLd.jobLocation).toEqual([place('US', 'San Francisco'), place('PT', 'Lisbon')]);
  });

  it('uses a country location as applicantLocationRequirements when the role is remote', () => {
    const jsonLd = build({ workMode: 'remote', location: ['US'] });
    expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
    expect(jsonLd.jobLocation).toBeUndefined();
    expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'US' });
  });

  /* LAB-2887: every location string on the live board (2026-10-16), and what Google gets for it. */
  describe('locations Google accepts', () => {
    it.each([
      ['San Francisco', place('US', 'San Francisco')],
      ['New York', place('US', 'New York')],
      ['San Mateo', place('US', 'San Mateo')],
      ['Hong Kong', place('HK', 'Hong Kong')],
      ['Hamburg', place('DE', 'Hamburg')],
      ['London', place('GB', 'London')],
      ['Berlin', place('DE', 'Berlin')],
      ['Houston, Texas', place('US', 'Houston')],
      ['US', place('US')],
      ['China', place('CN')],
      ['Singapore', place('SG', 'Singapore')],
      ['Portugal', place('PT')],
      ['India', place('IN')],
    ])('an on-site role in %j gets a place with a country', (location, expected) => {
      expect(build({ workMode: null, location: [location] }).jobLocation).toEqual([expected]);
    });

    it('reads a US state code as the US, not as the country sharing its letters', () => {
      expect(build({ workMode: null, location: ['San Francisco, CA'] }).jobLocation).toEqual([
        place('US', 'San Francisco'),
      ]);
      expect(build({ workMode: null, location: ['Wilmington, DE'] }).jobLocation).toEqual([place('US', 'Wilmington')]);
      expect(build({ workMode: null, location: ['Berlin, DE'] }).jobLocation).toEqual([place('DE', 'Berlin')]);
    });

    it('never emits a place without a country', () => {
      const all = ['San Francisco', 'EU', 'Europe', 'APAC', 'Hybrid', 'Motif', 'Motif - Main', 'Atlantis', 'London'];
      const places = build({ workMode: null, location: all }).jobLocation as { address: object }[];
      expect(places).toEqual([place('US', 'San Francisco'), place('GB', 'London')]);
    });

    it.each([['EU'], ['Europe'], ['APAC'], ['Motif'], ['Motif - Main'], ['Atlantis']])(
      'gives an on-site role located only in %j no markup, not a made-up place or a false remote',
      (location) => {
        expect(buildOrNull({ workMode: null, location: [location] })).toBeNull();
        expect(buildOrNull({ workMode: 'in-office', location: [location] })).toBeNull();
      },
    );

    /* LAB-2887: "TELECOMMUTE for remote or hybrid; otherwise the place is left out." */
    it.each([
      ['a hybrid work mode', { workMode: 'hybrid', location: ['EU'] }],
      ['a "Hybrid" location', { workMode: null, location: ['Hybrid', 'APAC'] }],
    ])('marks a role with %s and no resolvable office as TELECOMMUTE', (_label, overrides) => {
      const jsonLd = build(overrides);
      expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
      expect(jsonLd.jobLocation).toBeUndefined();
      expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'Worldwide' });
    });

    it('gives a hybrid role with a resolvable office that office, not TELECOMMUTE', () => {
      const jsonLd = build({ workMode: 'hybrid', location: ['London', 'Hybrid'] });
      expect(jsonLd.jobLocation).toEqual([place('GB', 'London')]);
      expect(jsonLd.jobLocationType).toBeUndefined();
    });

    it('keeps a remote role that names only a region as remote, worldwide', () => {
      const jsonLd = build({ workMode: 'remote', location: ['EU'] });
      expect(jsonLd.jobLocationType).toBe('TELECOMMUTE');
      expect(jsonLd.jobLocation).toBeUndefined();
      expect(jsonLd.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'Worldwide' });
    });
  });
});
