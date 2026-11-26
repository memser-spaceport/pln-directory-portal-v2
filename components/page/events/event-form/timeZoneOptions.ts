import { formatInTimeZone } from 'date-fns-tz';

/** Offered when the browser cannot list its time zones. */
const BUILT_IN_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Lisbon',
  'Europe/Berlin',
  'Europe/Kyiv',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export interface TimeZoneOption {
  /** IANA name: "Europe/Lisbon". */
  value: string;
  /** "Europe/Lisbon (UTC+01:00)". */
  label: string;
}

type IntlWithZones = typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };

/** Every IANA zone the browser knows, with UTC first and the current value always among them. */
export function timeZoneNames(current: string): string[] {
  let names = BUILT_IN_ZONES;
  try {
    const supported = (Intl as IntlWithZones).supportedValuesOf?.('timeZone');
    if (supported?.length) names = supported;
  } catch {
    names = BUILT_IN_ZONES;
  }
  const rest = new Set([...names, ...(current ? [current] : [])]);
  rest.delete('UTC');
  return ['UTC', ...Array.from(rest).sort()];
}

/** A zone as a person reads it, with the UTC offset it has at `at`. */
export function timeZoneLabel(zone: string, at: Date = new Date()): string {
  const name = zone.replace(/_/g, ' ');
  try {
    return `${name} (UTC${formatInTimeZone(at, zone, 'xxx')})`;
  } catch {
    return name;
  }
}

export function timeZoneOptions(current: string, at: Date = new Date()): TimeZoneOption[] {
  return timeZoneNames(current).map((value) => ({ value, label: timeZoneLabel(value, at) }));
}

/** Options whose name or offset holds every word of the search. */
export function searchTimeZones(options: TimeZoneOption[], search: string): TimeZoneOption[] {
  const words = search.toLowerCase().replace(/_/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return options;
  return options.filter((option) => {
    const text = option.label.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
