import type { Metadata } from 'next';
import { BrowseIndexPage, browseMetadata } from '@/components/page/browse/BrowseIndexPage';

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** Every public team, A to Z, so a crawler following links from /teams reaches each profile (LAB-3093). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return browseMetadata('teams', await searchParams);
}

export default async function TeamsBrowsePage({ searchParams }: Props) {
  return <BrowseIndexPage kind="teams" searchParams={await searchParams} />;
}
