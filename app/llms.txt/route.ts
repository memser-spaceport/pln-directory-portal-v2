import { PAGE_ROUTES } from '@/utils/constants';
import { absoluteUrl, getApplicationBaseUrl } from '@/utils/seo';

export async function GET() {
  const jobs = absoluteUrl(PAGE_ROUTES.JOBS);
  const teams = absoluteUrl(PAGE_ROUTES.TEAMS);
  const members = absoluteUrl(PAGE_ROUTES.MEMBERS);
  const projects = absoluteUrl(PAGE_ROUTES.PROJECTS);
  const home = absoluteUrl(PAGE_ROUTES.HOME);
  const host = getApplicationBaseUrl() || 'https://os.pl.xyz';

  const body = `# Protocol Labs Directory

> The Protocol Labs Directory helps people find teams, members, projects, and open roles across the network.

Host: ${host}

## Jobs

- [Job Board](${jobs}): Open roles across the Protocol Labs network. Individual postings live under ${absoluteUrl('/jobs/openings')}/{uid}.

## Directory

- [Home](${home})
- [Teams](${teams})
- [Members](${members})
- [Projects](${projects})
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
