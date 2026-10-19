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

/**
 * Location strings that name no place: regions, work modes and catch-alls (LAB-2887). Emitting them as a city
 * ("EU", "Hybrid") made a JobPosting Google rejects. They are skipped, never guessed into a country.
 */
const NOT_A_PLACE = new Set([
  'eu',
  'europe',
  'european union',
  'emea',
  'apac',
  'asia',
  'asia pacific',
  'americas',
  'north america',
  'south america',
  'latam',
  'africa',
  'middle east',
  'onsite',
  'on-site',
  'in office',
  'in-office',
  'flexible',
  'multiple locations',
  'various',
]);

const WORLDWIDE = { '@type': 'Country', name: 'Worldwide' };
const PAY_UNIT_TEXT: Record<IJobPay['period'], string> = {
  year: 'YEAR',
  month: 'MONTH',
  hour: 'HOUR',
};

/** A place Google accepts: it always has a country (`jobLocation.address.addressCountry` is required). */
type ParsedPlace = { locality?: string; country: string };

export function jobDescriptionHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  const clean = sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(raw));
  return isBlankHtml(clean) ? '' : clean;
}

/**
 * The role's JobPosting, or null when the role can't be described honestly (LAB-2887): it is not remote and none
 * of its locations resolves to a country. Such a role gets no markup — its page is still indexed, it just isn't
 * offered to Google for Jobs — rather than a made-up place or a false "remote, worldwide".
 *
 * No `validThrough`: there is no real expiry signal yet, and the old posting date + 90 days marked roles that
 * are still open as expired. Closed roles leave the board, and their page answers 404, which is Google's
 * removal signal.
 */
export function buildJobPostingJsonLd(args: {
  role: IJobRole;
  team: IJobTeam;
  pageUrl: string;
  descriptionHtml: string;
}): Record<string, unknown> | null {
  const { role, team, pageUrl, descriptionHtml } = args;
  const { remote, places } = resolveJobLocation(role);
  if (!remote && places.length === 0) return null;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.roleTitle,
    description: descriptionHtml || role.roleTitle,
    url: pageUrl,
    datePosted: getJobDate(role),
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
  let hybridToken = false;
  let hasLocationText = false;

  for (const value of role.location) {
    if (value.trim()) hasLocationText = true;
    const parsed = parseLocation(value);
    if (!parsed) continue;
    if (parsed === 'remote') {
      remoteToken = true;
      continue;
    }
    if (parsed === 'hybrid') {
      hybridToken = true;
      continue;
    }
    places.push(parsed);
  }

  const workMode = (role.workMode ?? '').toLowerCase();
  const hybrid = workMode === 'hybrid' || hybridToken;
  // A role with no location at all is treated as remote, as before, and so is a hybrid role whose office can't
  // be resolved (LAB-2887: "TELECOMMUTE for remote or hybrid"). An on-site role whose locations all fail to
  // resolve is not: it gets no markup (see buildJobPostingJsonLd) instead of a false "remote, worldwide".
  const remote = REMOTE_WORK_MODES.has(workMode) || remoteToken || !hasLocationText || (hybrid && !places.length);

  return { remote, places };
}

/** A place with a country, 'remote', 'hybrid', or null for anything that names no resolvable place. */
function parseLocation(raw: string): ParsedPlace | 'remote' | 'hybrid' | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const whole = normalize(trimmed);
  if (REMOTE_LOCATION_TOKENS.has(whole)) return 'remote';
  if (whole === 'hybrid') return 'hybrid';
  if (NOT_A_PLACE.has(whole)) return null;

  const parts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return null;

  const lastNorm = normalize(last);
  if (parts.length === 1) {
    const city = COUNTRY_BY_CITY[lastNorm];
    if (city) return { locality: trimmed, country: city };
    const country = COUNTRY_BY_ALIAS[lastNorm];
    return country ? { country } : null;
  }

  // A known city settles "Berlin, DE"; then a US state ("San Francisco, CA", "Houston, Texas") beats a
  // two-letter country alias, since CA, DE, IN and IL are both.
  const country =
    COUNTRY_BY_CITY[normalize(parts[0])] ??
    (US_STATE_CODES.has(lastNorm.toUpperCase()) || US_STATE_NAMES.has(lastNorm) ? 'US' : undefined) ??
    COUNTRY_BY_ALIAS[lastNorm];
  return country ? { locality: parts.slice(0, -1).join(', '), country } : null;
}

function toJobLocation(place: ParsedPlace) {
  return {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      ...(place.locality ? { addressLocality: place.locality } : {}),
      addressCountry: place.country,
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
  hk: 'HK',
  'hong kong': 'HK',
  cn: 'CN',
  china: 'CN',
  kr: 'KR',
  'south korea': 'KR',
  korea: 'KR',
  ar: 'AR',
  argentina: 'AR',
};

/**
 * Cities job postings name without a country (LAB-2887: "San Francisco", "Hamburg", "London" were 80+ of the
 * board's on-site roles, and every one went to Google without the required country).
 */
const COUNTRY_BY_CITY: Record<string, string> = {
  'san francisco': 'US',
  'san mateo': 'US',
  'palo alto': 'US',
  'mountain view': 'US',
  'menlo park': 'US',
  'los angeles': 'US',
  'new york': 'US',
  'new york city': 'US',
  nyc: 'US',
  boston: 'US',
  seattle: 'US',
  austin: 'US',
  houston: 'US',
  chicago: 'US',
  denver: 'US',
  miami: 'US',
  'washington dc': 'US',
  'hong kong': 'HK',
  london: 'GB',
  hamburg: 'DE',
  berlin: 'DE',
  munich: 'DE',
  paris: 'FR',
  lisbon: 'PT',
  zurich: 'CH',
  amsterdam: 'NL',
  toronto: 'CA',
  vancouver: 'CA',
  singapore: 'SG',
  tokyo: 'JP',
  seoul: 'KR',
  bangalore: 'IN',
  bengaluru: 'IN',
  dubai: 'AE',
  'tel aviv': 'IL',
  sydney: 'AU',
};

const US_STATE_NAMES = new Set([
  'alabama',
  'alaska',
  'arizona',
  'arkansas',
  'california',
  'colorado',
  'connecticut',
  'delaware',
  'florida',
  'georgia',
  'hawaii',
  'idaho',
  'illinois',
  'indiana',
  'iowa',
  'kansas',
  'kentucky',
  'louisiana',
  'maine',
  'maryland',
  'massachusetts',
  'michigan',
  'minnesota',
  'mississippi',
  'missouri',
  'montana',
  'nebraska',
  'nevada',
  'new hampshire',
  'new jersey',
  'new mexico',
  'new york',
  'north carolina',
  'north dakota',
  'ohio',
  'oklahoma',
  'oregon',
  'pennsylvania',
  'rhode island',
  'south carolina',
  'south dakota',
  'tennessee',
  'texas',
  'utah',
  'vermont',
  'virginia',
  'washington',
  'west virginia',
  'wisconsin',
  'wyoming',
]);

const US_STATE_CODES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  ),
);
