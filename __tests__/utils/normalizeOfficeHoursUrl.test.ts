import { normalizeOfficeHoursUrl } from '@/utils/common.utils';

describe('normalizeOfficeHoursUrl', () => {
  it('should add https:// to URLs without protocol', () => {
    expect(normalizeOfficeHoursUrl('calendly.com/username')).toBe('https://calendly.com/username');
    expect(normalizeOfficeHoursUrl('example.com/meeting')).toBe('https://example.com/meeting');
  });

  it('should preserve URLs that already have https://', () => {
    expect(normalizeOfficeHoursUrl('https://calendly.com/username')).toBe('https://calendly.com/username');
    expect(normalizeOfficeHoursUrl('https://example.com/meeting')).toBe('https://example.com/meeting');
  });

  it('should preserve URLs that already have http://', () => {
    expect(normalizeOfficeHoursUrl('http://calendly.com/username')).toBe('http://calendly.com/username');
    expect(normalizeOfficeHoursUrl('http://example.com/meeting')).toBe('http://example.com/meeting');
  });

  it('should handle empty strings', () => {
    expect(normalizeOfficeHoursUrl('')).toBe('');
  });

  it('should handle URLs with subdomains', () => {
    expect(normalizeOfficeHoursUrl('subdomain.calendly.com/username')).toBe('https://subdomain.calendly.com/username');
  });

  it('should handle URLs with paths and query parameters', () => {
    expect(normalizeOfficeHoursUrl('calendly.com/username?param=value')).toBe('https://calendly.com/username?param=value');
  });

  it('should be case insensitive for protocol detection', () => {
    expect(normalizeOfficeHoursUrl('HTTP://example.com')).toBe('HTTP://example.com');
    expect(normalizeOfficeHoursUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
  });
});
