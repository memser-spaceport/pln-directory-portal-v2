import type { Metadata } from 'next';

import { PAGE_ROUTES } from '@/utils/constants';
import { getJobDate } from '@/utils/jobs.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { absoluteUrl, listingPageMetadata } from '@/utils/seo';
import { getJobByUid } from '@/services/jobs/getJobByUid';
import { JOB_DETAIL_PARAM, jobOpeningPath } from '@/services/jobs/job-detail-link';
import { getJobPreviewSnippet } from '@/services/jobs/jobPreviewSnippet';
import { JOBS_BOARD_TITLE, jobRoleSeoTitle } from '@/services/jobs/jobSeoTitles';

import { getJobsList } from '@/app/actions/jobs.actions';
import type { ServerJobsPage } from '@/services/jobs/hooks/useJobsQueries';
import { pickJobsParams } from '@/services/jobs/jobsParams';
import { SAVED_PARAM } from '@/services/jobs/savedParam';
import { jobsBrowserSearchParamsToApiQuery } from '@/utils/jobs-api-query';

import JobsContent from './JobsContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const JOBS_LISTING_METADATA = listingPageMetadata({
  title: JOBS_BOARD_TITLE,
  description: 'Open roles across the Protocol Labs network. Filter by function, seniority, and focus area.',
  path: PAGE_ROUTES.JOBS,
});

export default async function Page({ searchParams }: PageProps) {
  const [{ userInfo, isLoggedIn, authToken }, params] = await Promise.all([getCookiesFromHeaders(), searchParams]);
  const serverPage = await getServerJobsPage(params, authToken);
  return <JobsContent userInfo={userInfo} isLoggedIn={!!isLoggedIn} serverPage={serverPage} />;
}

/**
 * How long the board's server render waits for its first page before leaving the list to the browser. Production
 * answers in about 1 s; the dev backend in 2–5 s, and a tighter budget dropped the list there on every request.
 */
const SERVER_PAGE_TIMEOUT_MS = 8_000;

/**
 * Page 1 of the board for the URL's filters, fetched the way the browser fetches it — the same param picking
 * (`pickJobsParams`), the same API mapping and the viewer's own token, as `/api/jobs/list` does — so the server
 * HTML carries the list and a link to every role (LAB-2888). A failure, or no answer within 8 s, returns nothing
 * and the board loads in the browser, as it always has — a slow backend never makes a slow page.
 *
 * The saved scope is always left out, signed in or not: the hydrating render can't see the session either
 * (`useJobsSearchParams`), and the two must agree. A signed-in viewer's saved list loads right after.
 */
async function getServerJobsPage(
  params: { [key: string]: string | string[] | undefined },
  authToken: string | undefined,
): Promise<ServerJobsPage | undefined> {
  const raw = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) raw.append(name, v);
  }
  const picked = pickJobsParams(raw);
  picked.delete(SAVED_PARAM);
  const key = picked.toString();

  const withPage = new URLSearchParams(picked);
  withPage.set('page', '1');
  const result = await getJobsList(
    jobsBrowserSearchParamsToApiQuery(withPage),
    authToken || undefined,
    AbortSignal.timeout(SERVER_PAGE_TIMEOUT_MS),
  );
  return 'isError' in result ? undefined : { key, page: result.data };
}

/** The board writes `?job=<uid>` for its own detail drawer, and links shared
 *  before `/jobs/openings/<uid>` existed still carry it, so this URL previews as
 *  the role rather than as the board.
 *
 *  Lives here rather than in the route group's layout because a layout is never
 *  handed `searchParams`. Next walks every parallel slot when it collects
 *  metadata, so a slot page contributes it just as a plain page would.
 *
 *  The canonical is deliberately the permalink, never this URL: `?job=` is an
 *  in-app view flag that also picks up refer-menu UTMs, and every variant has to
 *  fold into the one indexed address.
 *
 *  A uid that does not resolve — malformed, or a role filled and delisted since
 *  the link was shared — falls back to the board's own card, canonical included,
 *  because there is then no permalink worth pointing at. */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const job = params[JOB_DETAIL_PARAM];
  const jobUid = Array.isArray(job) ? job[0] : job;

  if (!jobUid) {
    return JOBS_LISTING_METADATA;
  }

  const resolved = await getJobByUid(jobUid);

  if (!resolved) {
    return JOBS_LISTING_METADATA;
  }

  const { role, team } = resolved;
  const jobUrl = absoluteUrl(jobOpeningPath(role.uid));
  const imageUrl = absoluteUrl(`/api/og/jobs/${encodeURIComponent(role.uid)}`);
  const description = getJobPreviewSnippet(role, team);

  return {
    title: jobRoleSeoTitle(role, team),
    description,
    alternates: { canonical: jobUrl },
    openGraph: {
      type: 'article',
      url: jobUrl,
      siteName: 'Protocol Labs Directory',
      title: role.roleTitle,
      description,
      publishedTime: getJobDate(role),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: role.roleTitle,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: role.roleTitle,
      description,
      images: [imageUrl],
    },
  };
}
