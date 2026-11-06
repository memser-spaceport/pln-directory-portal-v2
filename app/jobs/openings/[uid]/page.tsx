import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getJobOpening } from '@/app/actions/jobs.actions';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { JobOpeningView } from '@/components/page/jobs/JobOpeningView/JobOpeningView';
import { jobOpeningPath } from '@/services/jobs/job-detail-link';
import { jobRoleSeoTitle } from '@/services/jobs/jobSeoTitles';
import { buildJobPostingJsonLd, jobDescriptionHtml } from '@/services/jobs/job-posting-jsonld';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { absoluteUrl, htmlToPlainSnippet } from '@/utils/seo';

type PageProps = {
  params: Promise<{ uid: string }>;
};

/** Backend answers that mean the role isn't there: removed, closed, or a uid that was never valid. */
const GONE_STATUSES = new Set([400, 404, 410]);

/**
 * The role and its team, or null when the backend says the role is gone (LAB-2887). Any other failure — a 5xx,
 * a 429, a timeout, a network error — is ours to retry, so it throws: Next answers 500 and Google comes back
 * later. Turning every failure into a 404 with noindex told Google to drop live roles whenever the backend
 * hiccuped.
 */
async function loadRole(uid: string): Promise<{ group: IJobTeamGroup; role: IJobRole } | null> {
  const result = await getJobOpening(uid);
  if ('isError' in result) {
    if (result.status !== undefined && GONE_STATUSES.has(result.status)) return null;
    throw new Error(`Job opening could not be loaded (${result.status ?? 'network error or timeout'})`);
  }
  const role = result.data.roles[0];
  return role ? { group: result.data, role } : null;
}

export async function generateMetadata({ params }: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { uid } = await params;
  const loaded = await loadRole(uid);
  const pageUrl = absoluteUrl(jobOpeningPath(uid));
  const previousImages = (await parent).openGraph?.images || [];

  if (!loaded) {
    return {
      title: 'Job | Protocol Labs Directory',
      robots: { index: false, follow: false },
    };
  }

  const { role } = loaded;
  const team = loaded.group.team;

  const location = role.location.length ? role.location.join(', ') : null;
  const title = jobRoleSeoTitle(role, team);
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
  const [{ userInfo, isLoggedIn }, loaded] = await Promise.all([getCookiesFromHeaders(), loadRole(uid)]);
  if (!loaded) notFound();

  const { group, role } = loaded;
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
      {/* No markup for a role that can't be described honestly (buildJobPostingJsonLd). `<` escaped, as
          Next's JSON-LD guide says: a description containing `</script>` must not end the tag. */}
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- JSON-LD from our own data, serialized with `<` escaped
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <JobOpeningView group={group} userInfo={userInfo} isLoggedIn={!!isLoggedIn} />
    </>
  );
}

export const dynamic = 'force-dynamic';
