import { KEY_TO_HANDLER } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoView/constants';
import type { ITeam } from '@/types/teams.types';
import { getProfileFromURL, getSocialLinkUrl } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { memberSkillTitles } from '@/utils/member/memberSkillTags';
import { absoluteUrl, htmlToPlainSnippet } from '@/utils/seo';

/**
 * Structured data for member, team and project profiles (LAB-3090). Each builder takes the data the page renders and
 * emits only what a signed-out visitor sees there: a member's social links and location are behind "Login for access",
 * so they are not in the markup; a team's contact links are shown to everyone, so they are.
 *
 * Serialize with `serializeJsonLd` (utils/json-ld.ts), which escapes the text for an inline script tag.
 */

type JsonLd = Record<string, unknown>;

/** Long enough for a real description, short enough not to repeat a whole AI-written bio. */
const DESCRIPTION_MAX = 500;

type MemberTeam = { id?: string; name?: string; role?: string };

export type MemberForJsonLd = {
  id: string;
  name: string;
  profile?: string | null;
  bio?: string | null;
  role?: string | null;
  mainTeam?: MemberTeam | null;
  teams?: MemberTeam[];
  skills?: Array<{ uid?: string; title: string }>;
  customSkills?: string[];
};

/** What the team builder reads: the header fields and the contact fields TeamContactInfoView links to. */
export type TeamForJsonLd = { id: string; name: string } & Partial<
  Pick<
    ITeam,
    | 'logo'
    | 'shortDescription'
    | 'longDescription'
    | 'website'
    | 'twitter'
    | 'linkedinHandle'
    | 'telegramHandler'
    | 'blog'
    | 'blueskyHandler'
    | 'crunchbaseHandler'
  >
>;

export type ProjectForJsonLd = {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  logo?: string | null;
  projectLinks?: Array<{ url?: string | null }>;
  maintainingTeam?: { uid?: string; name?: string } | null;
};

function withGraph(nodes: JsonLd[]): JsonLd {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

function breadcrumb(section: { name: string; path: string }, name: string, pageUrl: string): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: section.name, item: absoluteUrl(section.path) },
      { '@type': 'ListItem', position: 2, name, item: pageUrl },
    ],
  };
}

function teamReference(team: { id?: string; uid?: string; name?: string | null }): JsonLd | undefined {
  const uid = team.id || team.uid;
  if (!team.name) return undefined;
  return {
    '@type': 'Organization',
    name: team.name,
    ...(uid ? { url: absoluteUrl(`${PAGE_ROUTES.TEAMS}/${uid}`) } : {}),
  };
}

/** Absolute http(s) addresses only, once each. A LinkedIn search link is a guess, not the profile, so it is left out. */
function sameAsUrls(urls: Array<string | null | undefined>): string[] {
  const valid = urls.filter((url): url is string => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return (
        (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.pathname.startsWith('/search/results')
      );
    } catch {
      return false;
    }
  });
  return [...new Set(valid)];
}

/** `ProfilePage` about a `Person`, with the team and role the profile header shows. */
export function buildMemberJsonLd(member: MemberForJsonLd): JsonLd {
  const pageUrl = absoluteUrl(`${PAGE_ROUTES.MEMBERS}/${member.id}`);
  // As MemberDetailHeader picks them: the main team, or the only team; its role, or the member's own.
  const team = member.mainTeam ?? (member.teams?.length === 1 ? member.teams[0] : null);
  const jobTitle = team?.role || member.role;
  const worksFor = team ? teamReference(team) : undefined;
  const description = htmlToPlainSnippet(member.bio, DESCRIPTION_MAX);
  const skills = memberSkillTitles(member);

  const person: JsonLd = {
    '@type': 'Person',
    '@id': `${pageUrl}#person`,
    name: member.name,
    url: pageUrl,
    ...(member.profile ? { image: member.profile } : {}),
    ...(jobTitle ? { jobTitle } : {}),
    ...(worksFor ? { worksFor } : {}),
    ...(description ? { description } : {}),
    ...(skills.length ? { knowsAbout: skills } : {}),
  };

  return withGraph([
    { '@type': 'ProfilePage', '@id': pageUrl, url: pageUrl, name: member.name, mainEntity: { '@id': person['@id'] } },
    person,
    breadcrumb({ name: 'Members', path: PAGE_ROUTES.MEMBERS }, member.name, pageUrl),
  ]);
}

/** `Organization` with the contact links the team's Contact Details section shows to every visitor. */
export function buildTeamJsonLd(team: TeamForJsonLd): JsonLd {
  const pageUrl = absoluteUrl(`${PAGE_ROUTES.TEAMS}/${team.id}`);
  const description =
    htmlToPlainSnippet(team.shortDescription, DESCRIPTION_MAX) ||
    htmlToPlainSnippet(team.longDescription, DESCRIPTION_MAX);
  // Built as TeamContactInfoView builds its links, so the markup names the addresses the page links to.
  const sameAs = sameAsUrls(
    Object.entries(KEY_TO_HANDLER).map(([key, handler]) => {
      const value = (team as Record<string, unknown>)[key];
      return typeof value === 'string' && value.trim()
        ? getSocialLinkUrl(getProfileFromURL(value, handler), handler, value)
        : null;
    }),
  );

  return withGraph([
    {
      '@type': 'Organization',
      '@id': `${pageUrl}#organization`,
      name: team.name,
      url: pageUrl,
      ...(team.logo ? { logo: team.logo } : {}),
      ...(description ? { description } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    breadcrumb({ name: 'Teams', path: PAGE_ROUTES.TEAMS }, team.name, pageUrl),
  ]);
}

/**
 * `CreativeWork`: a directory project can be a protocol, a product or a research effort, and nothing in its data says
 * which, so the general type rather than `SoftwareSourceCode`, which promises code.
 */
export function buildProjectJsonLd(project: ProjectForJsonLd): JsonLd {
  const pageUrl = absoluteUrl(`${PAGE_ROUTES.PROJECTS}/${project.id}`);
  const description =
    htmlToPlainSnippet(project.tagline, DESCRIPTION_MAX) || htmlToPlainSnippet(project.description, DESCRIPTION_MAX);
  const maintainer = project.maintainingTeam ? teamReference(project.maintainingTeam) : undefined;
  const sameAs = sameAsUrls((project.projectLinks ?? []).map((link) => link.url));

  return withGraph([
    {
      '@type': 'CreativeWork',
      '@id': `${pageUrl}#project`,
      name: project.name,
      url: pageUrl,
      ...(project.logo ? { image: project.logo } : {}),
      ...(description ? { description } : {}),
      ...(maintainer ? { creator: maintainer } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    breadcrumb({ name: 'Projects', path: PAGE_ROUTES.PROJECTS }, project.name, pageUrl),
  ]);
}
