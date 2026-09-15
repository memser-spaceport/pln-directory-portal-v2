import type { Metadata } from 'next';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { JOB_DETAIL_PARAM, jobOpeningPath } from '@/services/jobs/job-detail-link';
import { PAGE_ROUTES } from '@/utils/constants';
import { absoluteUrl, listingPageMetadata } from '@/utils/seo';
import JobsContent from './JobsContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const JOBS_LISTING_METADATA = listingPageMetadata({
  title: 'Jobs | Protocol Labs Directory',
  description: 'Open roles across the Protocol Labs network. Filter by function, seniority, and focus area.',
  path: PAGE_ROUTES.JOBS,
});

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const job = params[JOB_DETAIL_PARAM];
  const jobUid = Array.isArray(job) ? job[0] : job;
  if (!jobUid) {
    return JOBS_LISTING_METADATA;
  }

  const jobUrl = absoluteUrl(jobOpeningPath(jobUid));

  return {
    ...JOBS_LISTING_METADATA,
    alternates: { canonical: jobUrl },
    openGraph: {
      ...JOBS_LISTING_METADATA.openGraph,
      url: jobUrl,
    },
  };
}

export default async function Page() {
  const { userInfo, isLoggedIn } = await getCookiesFromHeaders();
  return <JobsContent userInfo={userInfo} isLoggedIn={!!isLoggedIn} />;
}
