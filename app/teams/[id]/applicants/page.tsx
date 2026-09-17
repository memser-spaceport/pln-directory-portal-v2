import { Metadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';

import Error from '@/components/core/error';
import { TeamApplicantsView } from '@/components/page/team-details/TeamApplicants';
import { canReadApplicants } from '@/components/page/team-details/TeamApplicants/canReadApplicants';
import { selectTeamOpenRoles } from '@/components/page/team-details/TeamOpenRoles/selectTeamOpenRoles';
import { getJobsList } from '@/app/actions/jobs.actions';
import { SHOW_TEAM_APPLICANTS } from '@/services/jobs/constants';
import { getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { ITeamDetailParams } from '@/types/teams.types';
import { AIRTABLE_REGEX, PAGE_ROUTES } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

import styles from './page.module.scss';

/**
 * The team's applicants, per role — a page of the team's own.
 *
 * **Why a page rather than a tab on the profile.** A modal or a section answers
 * "who applied?"; it does not answer "which of these fifty should I write to?",
 * because judging each one means opening each one. This keeps the list in place
 * and shows the person beside it, so a lead steps through applicants the way
 * they step through an inbox.
 *
 * **The gate lives here, not in `proxy.ts`.** `PROTECTED_ROUTES` is a list of
 * path prefixes, and the rule this page needs is "a lead of *this* team" —
 * which a path cannot express. Adding `/teams/` there would gate every public
 * team profile instead.
 *
 * The redirect is to the team's profile rather than a 403 screen: someone who
 * followed a stale link from a colleague should land somewhere useful, and the
 * team profile is where the link came from. It also declines to confirm whether
 * the team has applicants, which a distinct "not allowed" page would.
 *
 * None of this is a security boundary — the endpoints enforce the same rule
 * server-side. This is the affordance.
 */
async function Page(props: { params: Promise<ITeamDetailParams>; searchParams: Promise<{ role?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const teamId: string = params?.id;
  const teamProfile = `${PAGE_ROUTES.TEAMS}/${teamId}`;

  const { userInfo, isLoggedIn } = await getCookiesFromHeaders();

  /* Before any fetch. With the flag off this route does not exist, and a
     redirect is the cheapest way to say so without a 404 page that hints
     something is coming. */
  if (!canReadApplicants({ flagOn: SHOW_TEAM_APPLICANTS, isLoggedIn, userInfo, teamId })) {
    redirect(teamProfile, RedirectType.replace);
  }

  const { team, roles, redirectTeamUid, isError, isNotFound } = await getPageData(teamId);

  if (redirectTeamUid) {
    redirect(`${PAGE_ROUTES.TEAMS}/${redirectTeamUid}/applicants`, RedirectType.replace);
  }

  if (isNotFound || isError) {
    return <Error />;
  }

  return (
    <div className={styles.applicants}>
      <TeamApplicantsView
        teamId={teamId}
        teamName={team?.name ?? ''}
        roles={roles}
        initialRoleUid={searchParams?.role ?? null}
        viewerUid={userInfo?.uid}
        isLoggedIn={!!isLoggedIn}
      />
    </div>
  );
}

export default Page;

async function getPageData(teamId: string) {
  let isError = false;
  let isNotFound = false;

  try {
    if (AIRTABLE_REGEX.test(teamId)) {
      const teamUidResponse = await getTeamUIDByAirtableId(teamId);
      if (teamUidResponse?.error || teamUidResponse?.length === 0) {
        return { isError: true, team: null, roles: [] };
      }
      return { redirectTeamUid: teamUidResponse[0]?.uid, team: null, roles: [] };
    }

    const [teamResponse, jobsResponse] = await Promise.all([
      getTeam(teamId, { with: 'logo' }),
      /* `limit` pages teams, not roles, so one group carries all of this team's
         postings. `getJobsList` resolves an error object rather than throwing,
         which matters here: the catch below turns any throw into the error
         screen, and a jobs-API blip should cost the role list, not the page. */
      getJobsList(`teamUid=${encodeURIComponent(teamId)}&limit=1`),
    ]);

    if (teamResponse?.error) {
      isError = true;
      return { isError, team: null, roles: [] };
    }

    /* Counts are NOT fetched here. They are owner-only, and this page is
       server-rendered — a privileged number in the SSR payload is a number in
       the HTML. The view asks for them client-side, gated on the same rule the
       redirect above applies. */
    const group = selectTeamOpenRoles(jobsResponse, teamId);

    return { team: teamResponse?.data?.formatedData, roles: group?.roles ?? [], isError, isNotFound };
  } catch (error: any) {
    console.error(error);
    return { isNotFound: true, team: null, roles: [] };
  }
}

type IGenerateMetadata = { params: Promise<{ id: string }> };

/**
 * No `openGraph`, and `robots: noindex`.
 *
 * Every other team route builds a share card, because every other team route is
 * public. This one is a lead-only list of people who applied for a job — a
 * preview of it in a chat window would be a leak, and a crawler has no business
 * holding the URL at all.
 */
export async function generateMetadata(props: IGenerateMetadata): Promise<Metadata> {
  const params = await props.params;
  const teamResponse = await getTeam(params.id, { with: 'logo' });
  const team = teamResponse?.error ? null : teamResponse?.data?.formatedData;

  return {
    title: team?.name ? `${team.name} - Applicants | Protocol Labs Directory` : 'Applicants',
    robots: { index: false, follow: false },
  };
}
