import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { isBlankHtml, normalizeJobDescriptionHtml, sanitizeJobDescriptionHtml } from '@/utils/html';
import { getJobDate } from '@/utils/jobs.utils';
import { absoluteUrl } from '@/utils/seo';

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
  const remote = role.workMode === 'remote' || role.workMode === 'distributed';
  const datePosted = getJobDate(role);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.roleTitle,
    description: descriptionHtml || role.roleTitle,
    url: pageUrl,
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

  if (datePosted) {
    jsonLd.datePosted = datePosted;
  }

  if (role.location.length > 0) {
    jsonLd.jobLocation = role.location.map((name) => ({
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: name,
      },
    }));
  }

  if (remote) {
    jsonLd.jobLocationType = 'TELECOMMUTE';
  }

  return jsonLd;
}
