import type { Metadata } from 'next';

import { PAGE_ROUTES } from '@/utils/constants';
import { getJobDate } from '@/utils/jobs.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { absoluteUrl, listingPageMetadata } from '@/utils/seo';
import { getJobByUid } from '@/services/jobs/getJobByUid';
import { JOB_DETAIL_PARAM, jobOpeningPath } from '@/services/jobs/job-detail-link';
import { getJobPreviewSnippet } from '@/services/jobs/jobPreviewSnippet';

import JobsContent from './JobsContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const JOBS_LISTING_METADATA = listingPageMetadata({
  title: 'Jobs | Protocol Labs Directory',
  description: 'Open roles across the Protocol Labs network. Filter by function, seniority, and focus area.',
  path: PAGE_ROUTES.JOBS,
});

export default async function Page() {
  const { userInfo, isLoggedIn } = await getCookiesFromHeaders();
  return <JobsContent userInfo={userInfo} isLoggedIn={!!isLoggedIn} />;
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
    title: `${role.roleTitle} | Protocol Labs Directory`,
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
