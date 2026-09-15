import { absoluteUrl, getApplicationBaseUrl, htmlToPlainSnippet, listingPageMetadata } from '@/utils/seo';

describe('seo utils', () => {
  const original = process.env.APPLICATION_BASE_URL;

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  it('strips a trailing slash from the application base URL', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz/';
    expect(getApplicationBaseUrl()).toBe('https://os.pl.xyz');
  });

  it('builds absolute Directory URLs on the configured host', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    expect(absoluteUrl('/jobs')).toBe('https://os.pl.xyz/jobs');
    expect(absoluteUrl('teams/abc')).toBe('https://os.pl.xyz/teams/abc');
  });

  it('sets a self-referential canonical and OG url on listing metadata', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    const metadata = listingPageMetadata({
      title: 'Jobs | Protocol Labs Directory',
      description: 'Open roles',
      path: '/jobs',
    });
    expect(metadata.alternates).toEqual({ canonical: 'https://os.pl.xyz/jobs' });
    expect(metadata.openGraph?.url).toBe('https://os.pl.xyz/jobs');
  });

  it('turns HTML into a plain snippet', () => {
    expect(htmlToPlainSnippet('<p>Senior engineer at <strong>Acme</strong></p>')).toBe('Senior engineer at Acme');
    expect(htmlToPlainSnippet('<p>abcdefghij</p>', 8)).toBe('abcdefg…');
  });
});
