import { PAGE_ROUTES } from '@/utils/constants';
import { absoluteUrl, getApplicationBaseUrl } from '@/utils/seo';

/**
 * Protocol Labs' own profiles, so search engines tie the directory to the organization they already know (LAB-3089).
 * The social links are the ones pl.xyz lists; protocol.ai redirects there; Q63930216 is Protocol Labs on Wikidata.
 */
export const PROTOCOL_LABS_SAME_AS = [
  'https://protocol.ai/',
  'https://www.wikidata.org/wiki/Q63930216',
  'https://x.com/protocollabs',
  'https://www.linkedin.com/company/protocollabs/',
  'https://www.youtube.com/ProtocolLabs',
];

/** The `/home` JSON-LD: Protocol Labs as the Organization, and the directory as its WebSite. */
export function buildHomeJsonLd() {
  const base = getApplicationBaseUrl();
  const organizationId = `${base}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Protocol Labs',
        url: 'https://pl.xyz/',
        description:
          'Protocol Labs is an innovation network driving breakthroughs in computing to push humanity forward.',
        sameAs: PROTOCOL_LABS_SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: 'Protocol Labs Directory',
        url: absoluteUrl(PAGE_ROUTES.HOME),
        inLanguage: 'en',
        publisher: { '@id': organizationId },
      },
    ],
  };
}
