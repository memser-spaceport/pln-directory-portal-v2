import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getMember } from '@/services/members.service';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { absoluteUrl, htmlToPlainSnippet } from '@/utils/seo';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const pageUrl = absoluteUrl(`${PAGE_ROUTES.MEMBERS}/${id}`);
  const fallback: Metadata = {
    title: 'Member | Protocol Labs Directory',
    alternates: { canonical: pageUrl },
    openGraph: { type: 'website', url: pageUrl, images: [SOCIAL_IMAGE_URL] },
    twitter: { card: 'summary_large_image', images: [SOCIAL_IMAGE_URL] },
  };

  const result = await getMember(id, { with: 'image' }, false, undefined, true);
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

export default function MemberLayout({ children }: LayoutProps) {
  return children;
}
