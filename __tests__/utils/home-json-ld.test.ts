/**
 * LAB-3089: /home describes Protocol Labs and the directory as structured data.
 */
import { buildHomeJsonLd, PROTOCOL_LABS_SAME_AS } from '@/utils/home-json-ld';

describe('buildHomeJsonLd', () => {
  const original = process.env.APPLICATION_BASE_URL;

  beforeEach(() => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz/';
  });

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  it('names Protocol Labs with its profiles, and the directory as its website', () => {
    const jsonLd = buildHomeJsonLd();
    const [organization, website] = jsonLd['@graph'] as Record<string, unknown>[];

    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(organization).toMatchObject({ '@type': 'Organization', name: 'Protocol Labs', url: 'https://pl.xyz/' });
    expect(organization.sameAs).toEqual(PROTOCOL_LABS_SAME_AS);
    expect(website).toMatchObject({
      '@type': 'WebSite',
      name: 'Protocol Labs Directory',
      url: 'https://os.pl.xyz/home',
      publisher: { '@id': organization['@id'] },
    });
  });

  it('links protocol.ai, Wikidata, X, LinkedIn and YouTube, all over https', () => {
    expect(PROTOCOL_LABS_SAME_AS).toEqual([
      'https://protocol.ai/',
      'https://www.wikidata.org/wiki/Q63930216',
      'https://x.com/protocollabs',
      'https://www.linkedin.com/company/protocollabs/',
      'https://www.youtube.com/ProtocolLabs',
    ]);
  });
});
