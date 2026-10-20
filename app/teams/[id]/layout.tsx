import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { isTeamNotFound } from '@/services/teams/teamProfileLookup';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

/**
 * An unknown team answers a real 404 (LAB-2922). The check sits here, not only in the page: the page renders inside
 * `loading.tsx`'s boundary, after the 200 has been streamed, so a `notFound()` there can only add `noindex`.
 */
export default async function TeamProfileLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  if (await isTeamNotFound(id)) {
    notFound();
  }
  return children;
}
