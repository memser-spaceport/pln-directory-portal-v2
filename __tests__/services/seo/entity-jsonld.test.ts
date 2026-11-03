/**
 * LAB-3090: member, team and project profiles carry structured data, built only from what a signed-out visitor sees.
 */
import { buildMemberJsonLd, buildProjectJsonLd, buildTeamJsonLd } from '@/services/seo/entity-jsonld';
import { serializeJsonLd } from '@/utils/json-ld';

type Node = Record<string, any>;
const graph = (jsonLd: Record<string, unknown>) => jsonLd['@graph'] as Node[];
const ofType = (jsonLd: Record<string, unknown>, type: string) => graph(jsonLd).find((node) => node['@type'] === type)!;

describe('entity JSON-LD', () => {
  const original = process.env.APPLICATION_BASE_URL;

  beforeEach(() => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz/';
  });

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  describe('member', () => {
    const member = {
      id: 'm1',
      name: 'Luise Vad',
      profile: 'https://images.example/luise.webp',
      bio: '<p>Luise is the VP of Sales at <b>Hex Trust</b>.</p>',
      role: 'Own title',
      mainTeam: { id: 't1', name: 'Hex Trust', role: 'VP of Sales' },
      teams: [
        { id: 't1', name: 'Hex Trust', role: 'VP of Sales' },
        { id: 't2', name: 'Other', role: 'Advisor' },
      ],
      skills: [{ uid: 's1', title: 'Strategy' }],
      customSkills: ['Custody'],
    };

    it('is a ProfilePage about a Person who works for their main team', () => {
      const jsonLd = buildMemberJsonLd(member);
      const page = ofType(jsonLd, 'ProfilePage');
      const person = ofType(jsonLd, 'Person');

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(page).toMatchObject({ url: 'https://os.pl.xyz/members/m1', mainEntity: { '@id': person['@id'] } });
      expect(person).toEqual({
        '@type': 'Person',
        '@id': 'https://os.pl.xyz/members/m1#person',
        name: 'Luise Vad',
        url: 'https://os.pl.xyz/members/m1',
        image: 'https://images.example/luise.webp',
        jobTitle: 'VP of Sales',
        worksFor: { '@type': 'Organization', name: 'Hex Trust', url: 'https://os.pl.xyz/teams/t1' },
        description: 'Luise is the VP of Sales at Hex Trust.',
        knowsAbout: ['Strategy', 'Custody'],
      });
    });

    it('carries no social links or location, which signed-out visitors cannot see', () => {
      const person = ofType(
        buildMemberJsonLd({ ...member, linkedinHandle: 'luise', location: { city: 'Munich' } } as any),
        'Person',
      );
      expect(person.sameAs).toBeUndefined();
      expect(person.address).toBeUndefined();
      expect(JSON.stringify(person)).not.toMatch(/linkedin|Munich/);
    });

    it('uses the only team when none is main, and leaves out what is missing', () => {
      const person = ofType(
        buildMemberJsonLd({ id: 'm2', name: 'Solo', teams: [{ id: 't9', name: 'Team Nine', role: '' }], role: 'Dev' }),
        'Person',
      );
      expect(person).toEqual({
        '@type': 'Person',
        '@id': 'https://os.pl.xyz/members/m2#person',
        name: 'Solo',
        url: 'https://os.pl.xyz/members/m2',
        jobTitle: 'Dev',
        worksFor: { '@type': 'Organization', name: 'Team Nine', url: 'https://os.pl.xyz/teams/t9' },
      });
    });

    it('has a breadcrumb from Members to the profile', () => {
      expect(ofType(buildMemberJsonLd(member), 'BreadcrumbList').itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: 'Members', item: 'https://os.pl.xyz/members' },
        { '@type': 'ListItem', position: 2, name: 'Luise Vad', item: 'https://os.pl.xyz/members/m1' },
      ]);
    });
  });

  describe('team', () => {
    it('is an Organization with the contact links its page shows', () => {
      const jsonLd = buildTeamJsonLd({
        id: 't1',
        name: 'Hex Trust',
        logo: 'https://images.example/hex.webp',
        shortDescription: 'Digital asset custody.',
        website: 'hextrust.com',
        twitter: '@hextrust',
        linkedinHandle: 'https://www.linkedin.com/company/hextrust/',
        telegramHandler: '',
        crunchbaseHandler: 'organization/hex-trust',
      });

      expect(ofType(jsonLd, 'Organization')).toEqual({
        '@type': 'Organization',
        '@id': 'https://os.pl.xyz/teams/t1#organization',
        name: 'Hex Trust',
        url: 'https://os.pl.xyz/teams/t1',
        logo: 'https://images.example/hex.webp',
        description: 'Digital asset custody.',
        sameAs: [
          'https://hextrust.com',
          'https://twitter.com/hextrust',
          'https://www.linkedin.com/company/hextrust',
          'https://www.crunchbase.com/organization/hex-trust',
        ],
      });
      expect(ofType(jsonLd, 'BreadcrumbList').itemListElement[0]).toMatchObject({
        name: 'Teams',
        item: 'https://os.pl.xyz/teams',
      });
    });

    it('leaves out a LinkedIn value that is only a search, and empty fields', () => {
      const organization = ofType(
        buildTeamJsonLd({ id: 't2', name: 'Bare', linkedinHandle: 'two words' }),
        'Organization',
      );
      expect(organization).toEqual({
        '@type': 'Organization',
        '@id': 'https://os.pl.xyz/teams/t2#organization',
        name: 'Bare',
        url: 'https://os.pl.xyz/teams/t2',
      });
    });
  });

  describe('project', () => {
    it('is a CreativeWork made by its maintaining team, with its links', () => {
      const jsonLd = buildProjectJsonLd({
        id: 'p1',
        name: 'builder.fi',
        tagline: 'Social trading for builders',
        description: '<p>Long text</p>',
        logo: 'https://images.example/b.webp',
        projectLinks: [{ url: 'https://www.builder.fi' }, { url: 'not a url' }, { url: 'https://www.builder.fi' }],
        maintainingTeam: { uid: 't3', name: 'Talent Protocol' },
      });

      expect(ofType(jsonLd, 'CreativeWork')).toEqual({
        '@type': 'CreativeWork',
        '@id': 'https://os.pl.xyz/projects/p1#project',
        name: 'builder.fi',
        url: 'https://os.pl.xyz/projects/p1',
        image: 'https://images.example/b.webp',
        description: 'Social trading for builders',
        creator: { '@type': 'Organization', name: 'Talent Protocol', url: 'https://os.pl.xyz/teams/t3' },
        sameAs: ['https://www.builder.fi'],
      });
      expect(ofType(jsonLd, 'BreadcrumbList').itemListElement[0]).toMatchObject({
        name: 'Projects',
        item: 'https://os.pl.xyz/projects',
      });
    });
  });

  it('cannot end the script tag, whatever a profile says', () => {
    const serialized = serializeJsonLd(buildMemberJsonLd({ id: 'm3', name: '</script><script>alert(1)</script>' }));
    expect(serialized).not.toContain('</script');
    expect(JSON.parse(serialized)['@graph'][1].name).toBe('</script><script>alert(1)</script>');
  });
});
