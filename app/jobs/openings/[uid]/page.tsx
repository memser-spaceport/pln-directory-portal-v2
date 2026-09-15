import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobOpening } from '@/app/actions/jobs.actions';
import { JobOpeningView } from '@/components/page/jobs/JobOpeningView/JobOpeningView';
import { jobOpeningPath } from '@/services/jobs/job-detail-link';
import { buildJobPostingJsonLd, jobDescriptionHtml } from '@/services/jobs/job-posting-jsonld';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { absoluteUrl, htmlToPlainSnippet } from '@/utils/seo';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({ params }: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { uid } = await params;
  const result = await getJobOpening(uid);
  const pageUrl = absoluteUrl(jobOpeningPath(uid));
  const previousImages = (await parent).openGraph?.images || [];

  if ('isError' in result) {
    return {
      title: 'Job | Protocol Labs Directory',
      robots: { index: false, follow: false },
    };
  }

  const group = result.data;
  const role = group.roles[0];
  const team = group.team;
  if (!role) {
    return {
      title: 'Job | Protocol Labs Directory',
      robots: { index: false, follow: false },
    };
  }

  const location = role.location.length ? role.location.join(', ') : null;
  const title = location
    ? `${role.roleTitle} at ${team.name} (${location}) | Protocol Labs Directory`
    : `${role.roleTitle} at ${team.name} | Protocol Labs Directory`;
  const description =
    htmlToPlainSnippet(jobDescriptionHtml(role.descriptionHtml)) ||
    `${role.roleTitle} at ${team.name}${location ? ` — ${location}` : ''}. Open role on the Protocol Labs Directory job board.`;
  const image = team.logoUrl || SOCIAL_IMAGE_URL;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      images: [{ url: image, alt: team.name }, ...previousImages],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function JobOpeningPage({ params }: PageProps) {
  const { uid } = await params;
  const [{ userInfo, isLoggedIn }, result] = await Promise.all([getCookiesFromHeaders(), getJobOpening(uid)]);

  if ('isError' in result || !result.data.roles[0]) {
    notFound();
  }

  const group = result.data;
  const role = group.roles[0];
  const pageUrl = absoluteUrl(jobOpeningPath(role.uid));
  const descriptionHtml = jobDescriptionHtml(role.descriptionHtml);
  const jsonLd = buildJobPostingJsonLd({
    role,
    team: group.team,
    pageUrl,
    descriptionHtml,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JobOpeningView group={group} userInfo={userInfo} isLoggedIn={!!isLoggedIn} />
    </>
  );
}

export const dynamic = 'force-dynamic';
