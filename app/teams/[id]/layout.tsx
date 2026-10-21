import type { ReactNode } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';

import { isTeamNotFound, lookUpAirtableTeam } from '@/services/teams/teamProfileLookup';
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
     its own. An id that belongs to no team is a real 404, not a 200 error page (a "soft 404"). A failed lookup falls
     through to the page, which shows its error as before, so a crawler retries. */
  if (AIRTABLE_REGEX.test(id)) {
    const lookup = await lookUpAirtableTeam(id);
    if (lookup.kind === 'found') {
      permanentRedirect(`${PAGE_ROUTES.TEAMS}/${lookup.uid}`);
    }
    if (lookup.kind === 'missing') {
      notFound();
    }
    return children;
  }

  if (await isTeamNotFound(id)) {
    notFound();
  }
  return children;
}
