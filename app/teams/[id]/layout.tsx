import type { ReactNode } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';

import { getTeamUidForAirtableId, isTeamNotFound } from '@/services/teams/teamProfileLookup';
import { AIRTABLE_REGEX, PAGE_ROUTES } from '@/utils/constants';

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

  /* An old Airtable record id redirects permanently to the team's uid (LAB-2924). The page used to redirect from
     inside its streamed body, so the response was a 200 with no canonical, and Google kept the old URL as a page of
     its own. A failed lookup falls through to the page, which shows its error as before. */
  if (AIRTABLE_REGEX.test(id)) {
    const uid = await getTeamUidForAirtableId(id);
    if (uid) {
      permanentRedirect(`${PAGE_ROUTES.TEAMS}/${uid}`);
    }
    return children;
  }

  if (await isTeamNotFound(id)) {
    notFound();
  }
  return children;
}
