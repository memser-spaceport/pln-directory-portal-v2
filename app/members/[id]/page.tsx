import { preload } from 'react-dom';
import { getMember } from '@/services/members.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import MemberDetailsPage, { type ServerMemberResult } from '@/components/page/member-details/MemberDetailsPage';

/** The image behind the signed-out contact-details panel; `ContactDetails.module.scss` paints it. */
const MEMBER_CONTACT_OVERLAY_IMAGE = '/images/members/contact-details-overlay.png';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * The member profile, with the public member fetched here so the profile is in the server HTML (LAB-2922).
 *
 * Only for a signed-out visitor: the public member renders as a signed-out visitor sees it, so a signed-in viewer
 * would be shown the login banner and blurred contacts until their own fetch lands. They get the loader instead.
 * Any failure (a member hidden from the public, an outage) passes nothing and the page loads in the browser as it
 * always has. An unknown member never gets here: the layout answers 404 for it.
 */
export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const { isLoggedIn } = await getCookiesFromHeaders();

  if (isLoggedIn) {
    return <MemberDetailsPage memberId={id} />;
  }

  /* The contact-details panel's blurred overlay is the page's largest element for a signed-out visitor, and it is a CSS
     background: the browser only learns its URL once the stylesheet is in, which cost it 1.2 s on mobile (LAB-3092).
     Named in the HTML instead, so it loads with the first response. */
  preload(MEMBER_CONTACT_OVERLAY_IMAGE, { as: 'image', fetchPriority: 'high' });

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
