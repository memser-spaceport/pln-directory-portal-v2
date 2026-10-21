import { getMember } from '@/services/members.service';
import MemberDetailsPage, { type ServerMemberResult } from '@/components/page/member-details/MemberDetailsPage';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * The member profile, with the public member fetched here so the profile is in the server HTML (LAB-2922).
 *
 * Fetched signed out, always: the server HTML carries only what a signed-out visitor may see, and the browser fetches
 * the viewer's own view on top. Any failure (a member hidden from the public, an outage) passes nothing and the page
 * loads in the browser as it always has. An unknown member never gets here: the layout answers 404 for it.
 */
export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMember(
    id,
    { with: 'image,skills,location,teamMemberRoles.team' },
    false,
    undefined,
    true,
    true,
  );
  const serverMember: ServerMemberResult | undefined =
    'error' in result || !result.data?.formattedData ? undefined : result;

  return <MemberDetailsPage memberId={id} serverMember={serverMember} />;
}
