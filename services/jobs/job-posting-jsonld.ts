import type { IJobPay, IJobRole, IJobTeam } from '@/types/jobs.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { isBlankHtml, normalizeJobDescriptionHtml, sanitizeJobDescriptionHtml } from '@/utils/html';
import { getJobDate } from '@/utils/jobs.utils';
import { absoluteUrl } from '@/utils/seo';

const REMOTE_WORK_MODES = new Set(['remote', 'distributed']);
const REMOTE_LOCATION_TOKENS = new Set([
  'remote',
  'distributed',
  'worldwide',
  'anywhere',
  'global',
  'wfh',
  'work from home',
  'telecommute',
]);

const WORLDWIDE = { '@type': 'Country', name: 'Worldwide' };
const JOB_POSTING_VALID_DAYS = 90;
const PAY_UNIT_TEXT: Record<IJobPay['period'], string> = {
  year: 'YEAR',
  month: 'MONTH',
  hour: 'HOUR',
};

type ParsedPlace = { locality?: string; country?: string };

export function jobDescriptionHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  const clean = sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(raw));
  return isBlankHtml(clean) ? '' : clean;
}

export function buildJobPostingJsonLd(args: {
  role: IJobRole;
  team: IJobTeam;
  pageUrl: string;
  descriptionHtml: string;
}): Record<string, unknown> {
  const { role, team, pageUrl, descriptionHtml } = args;
  const { remote, places } = resolveJobLocation(role);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.roleTitle,
    description: descriptionHtml || role.roleTitle,
    url: pageUrl,
    datePosted: getJobDate(role),
    validThrough: addUtcDays(getJobDate(role), JOB_POSTING_VALID_DAYS),
    employmentType: 'FULL_TIME',
    identifier: {
      '@type': 'PropertyValue',
      name: 'uid',
      value: role.uid,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: team.name,
      sameAs: absoluteUrl(`${PAGE_ROUTES.TEAMS}/${team.uid}`),
      ...(team.logoUrl ? { logo: team.logoUrl } : {}),
    },
  };

  const jobLocations = (remote ? places.filter((place) => place.locality) : places).map(toJobLocation);
  if (jobLocations.length > 0) {
    jsonLd.jobLocation = jobLocations;
  }

  if (remote) {
    jsonLd.jobLocationType = 'TELECOMMUTE';
    const countries = unique(places.map((place) => place.country).filter((code): code is string => Boolean(code)));
    jsonLd.applicantLocationRequirements = applicantLocationRequirements(countries);
  }

  const salary = baseSalary(role.pay);
  if (salary) {
    jsonLd.baseSalary = salary;
  }

  return jsonLd;
}

function addUtcDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function baseSalary(pay: IJobPay | null | undefined) {
  const unitText = pay ? PAY_UNIT_TEXT[pay.period] : undefined;
  if (!pay || !unitText) return undefined;
  return {
    '@type': 'MonetaryAmount',
    currency: pay.currency,
    value: {
      '@type': 'QuantitativeValue',
      minValue: pay.min,
      maxValue: pay.max,
      unitText,
    },
  };
}

function resolveJobLocation(role: IJobRole): { remote: boolean; places: ParsedPlace[] } {
  const places: ParsedPlace[] = [];
  let remoteToken = false;

  for (const value of role.location) {
    const parsed = parseLocation(value);
    if (!parsed) continue;
    if (parsed === 'remote') {
      remoteToken = true;
      continue;
    }
    places.push(parsed);
  }

  const remoteWork = REMOTE_WORK_MODES.has((role.workMode ?? '').toLowerCase());
  // Google rejects JobPosting if neither a place nor TELECOMMUTE is present. Never invent a city.
  const remote = remoteWork || remoteToken || places.length === 0;

  return { remote, places };
}

function parseLocation(raw: string): ParsedPlace | 'remote' | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (REMOTE_LOCATION_TOKENS.has(normalize(trimmed))) return 'remote';

  const parts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;

  const lastNorm = normalize(last);
  let country = COUNTRY_BY_ALIAS[lastNorm];
  if (!country && parts.length > 1 && US_STATE_CODES.has(lastNorm.toUpperCase())) {
    country = 'US';
  }

  if (country && parts.length === 1) return { country };
  if (country) return { locality: parts.slice(0, -1).join(', '), country };
  return { locality: trimmed };
}

function toJobLocation(place: ParsedPlace) {
  return {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      ...(place.locality ? { addressLocality: place.locality } : {}),
      ...(place.country ? { addressCountry: place.country } : {}),
    },
  };
}

function applicantLocationRequirements(countries: string[]) {
  const [country] = countries;
  if (!country) return WORLDWIDE;
  if (countries.length === 1) return countryRequirement(country);
  return countries.map(countryRequirement);
}

function countryRequirement(name: string) {
  return { '@type': 'Country', name };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

const COUNTRY_BY_ALIAS: Record<string, string> = {
  us: 'US',
  usa: 'US',
  'united states': 'US',
  'united states of america': 'US',
  uk: 'GB',
  gb: 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  canada: 'CA',
  de: 'DE',
  germany: 'DE',
  pt: 'PT',
  portugal: 'PT',
  fr: 'FR',
  france: 'FR',
  es: 'ES',
  spain: 'ES',
  nl: 'NL',
  netherlands: 'NL',
  ch: 'CH',
  switzerland: 'CH',
  at: 'AT',
  austria: 'AT',
  be: 'BE',
  belgium: 'BE',
  ie: 'IE',
  ireland: 'IE',
  it: 'IT',
  italy: 'IT',
  se: 'SE',
  sweden: 'SE',
  no: 'NO',
  norway: 'NO',
  dk: 'DK',
  denmark: 'DK',
  fi: 'FI',
  finland: 'FI',
  pl: 'PL',
  poland: 'PL',
  ee: 'EE',
  estonia: 'EE',
  lt: 'LT',
  lithuania: 'LT',
  in: 'IN',
  india: 'IN',
  sg: 'SG',
  singapore: 'SG',
  jp: 'JP',
  japan: 'JP',
  au: 'AU',
  australia: 'AU',
  nz: 'NZ',
  'new zealand': 'NZ',
  br: 'BR',
  brazil: 'BR',
  mx: 'MX',
  mexico: 'MX',
  ke: 'KE',
  kenya: 'KE',
  ng: 'NG',
  nigeria: 'NG',
  za: 'ZA',
  'south africa': 'ZA',
  ae: 'AE',
  uae: 'AE',
  'united arab emirates': 'AE',
  il: 'IL',
  israel: 'IL',
};

const US_STATE_CODES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  ),
);
