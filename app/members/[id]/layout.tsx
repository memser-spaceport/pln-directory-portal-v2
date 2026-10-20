import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMember } from '@/services/members.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { absoluteUrl, htmlToPlainSnippet } from '@/utils/seo';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

/** The member as a signed-out visitor sees them: the same call for the metadata and the not-found check below. */
const getPublicMember = (id: string, fresh?: boolean) =>
  getMember(id, { with: 'image' }, false, undefined, true, fresh);

/**
 * Whether this request should answer "not found" (LAB-2922): the API reports no member a signed-out visitor may see,
 * and the visitor is signed out.
 *
 * A signed-in viewer is never sent away here. `getMember` also answers 404 for a member who exists but is not public
 * yet, such as a pending member opening their own profile, and only the browser knows who is looking.
 *
 * The cached lookup can be stale (a member approved since it was cached), so a 404 is confirmed uncached before it is
 * served. Anything other than a 404 is not "not found": the page loads as it always has.
 */
async function isMemberNotFound(id: string, cached: Awaited<ReturnType<typeof getPublicMember>>): Promise<boolean> {
  if (!('error' in cached) || cached.error?.status !== 404) {
    return false;
  }
  const { isLoggedIn } = await getCookiesFromHeaders();
  if (isLoggedIn) {
    return false;
  }
  const fresh = await getPublicMember(id, true);
  return 'error' in fresh && fresh.error?.status === 404;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const pageUrl = absoluteUrl(`${PAGE_ROUTES.MEMBERS}/${id}`);
  const fallback: Metadata = {
    title: 'Member | Protocol Labs Directory',
    alternates: { canonical: pageUrl },
    openGraph: { type: 'website', url: pageUrl, images: [SOCIAL_IMAGE_URL] },
    twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE_URL] },
  };

  const result = await getPublicMember(id);
  // Here as well as in the layout: metadata resolves before the streamed shell for crawlers, so this is what turns an
  // unknown member into a real 404 status rather than a 200 with `noindex`.
  if (await isMemberNotFound(id, result)) {
    notFound();
  }
  if ('error' in result || !result.data?.formattedData) {
    return fallback;
  }

  const member = result.data.formattedData;
  const description = htmlToPlainSnippet(member.bio) || `${member.name} on Protocol Labs Directory`;
  const image = member.profile || SOCIAL_IMAGE_URL;

  return {
    title: `${member.name} | Protocol Labs Directory`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'profile',
      url: pageUrl,
      title: member.name,
      description,
      images: [{ url: image, alt: member.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: member.name,
      description,
      images: [image],
    },
  };
}

export default async function MemberLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  if (await isMemberNotFound(id, await getPublicMember(id))) {
    notFound();
  }
  return children;
}
