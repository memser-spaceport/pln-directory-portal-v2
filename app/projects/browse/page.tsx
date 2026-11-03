import type { Metadata } from 'next';
import { BrowseIndexPage, browseMetadata } from '@/components/page/browse/BrowseIndexPage';

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** Every public project, A to Z, so a crawler following links from /projects reaches each profile (LAB-3093). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return browseMetadata('projects', await searchParams);
}

export default async function ProjectsBrowsePage({ searchParams }: Props) {
  return <BrowseIndexPage kind="projects" searchParams={await searchParams} />;
}
