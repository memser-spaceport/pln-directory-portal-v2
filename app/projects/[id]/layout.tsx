import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { getProject } from '@/services/projects.service';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * An unknown project answers a real 404 (LAB-2922). The check sits here, not only in the page: the page renders inside
 * `loading.tsx`'s boundary, after the 200 has been streamed, so a `notFound()` there can only add `noindex`.
 *
 * `getProject` is the same cached call the page and its metadata make, so this adds no request.
 */
export default async function ProjectProfileLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const result = await getProject(id, {});
  if (result?.error?.status === 404) {
    notFound();
  }
  return children;
}
