import type { Metadata } from 'next';
import { BrowseIndexPage, browseMetadata } from '@/components/page/browse/BrowseIndexPage';

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** Every public member, A to Z, so a crawler following links from /members reaches each profile (LAB-3093). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return browseMetadata('members', await searchParams);
}

export default async function MembersBrowsePage({ searchParams }: Props) {
  return <BrowseIndexPage kind="members" searchParams={await searchParams} />;
}
