import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ADMIN_ROLE, MEMBER_ANALYTICS_EVENTS, PAGE_ROUTES } from '@/utils/constants';
import { useRouter } from 'next/navigation';

interface IMemberEmptyProjectExperience {
  userInfo: any;
  member: any;
  profileType: string;
}
/**
 * MemberEmptyProjectExperience component displays a message to the user
 * indicating that no project experience or contribution details have been added.
 * 
 * @param {IMemberEmptyProjectExperience} props - The properties object.
 * @param {Object} props.userInfo - The information about the current user.
 * @param {Array<string>} [props.userInfo.roles] - The roles assigned to the current user.
 * @param {Object} props.member - The information about the member whose details are being viewed.
 * 
 * @returns {JSX.Element} The rendered component.
 * 
 * The component checks if the current user is the owner of the profile or an admin.
 * If the user is either the owner or an admin, it displays a link to add project experience and contribution details.
 * If the user is neither the owner nor an admin, it displays a message indicating that no project has been added yet.
 * 
 * The component also includes some basic styling for the displayed messages.
 */
const MemberEmptyProjectExperience = (props: IMemberEmptyProjectExperience) => {
  const userInfo = props?.userInfo;
  const member = props?.member;
  const router = useRouter();

  const isOwner = userInfo.uid === member.id;
  const isAdmin = userInfo.roles?.length > 0 && userInfo.roles.includes(ADMIN_ROLE);

  const analytics = useMemberAnalytics();

  const onEditOrAdd = () => {
    analytics.onProjectContributionAddlicked(member);
    if (isAdmin && !isOwner) {
      router.push(`${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}`);
    } else {
      router.push(`${PAGE_ROUTES.SETTINGS}/profile`);
    }
  };

  return (
    <>
      {(isOwner || isAdmin) && (
        <div className="member-empty-contribution">
          <p>
            <a href={isAdmin && !isOwner ? `${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}` : `${PAGE_ROUTES.SETTINGS}/profile`} className="member-empty-contribution__update" onClick={onEditOrAdd}>
              Click here
            </a>
            to add project experience & contribution details.
          </p>
        </div>
      )}

      {!isOwner && !isAdmin && (
        <div className="member-empty-contribution">
          <p>No project added yet.</p>
        </div>
      )}

      <style jsx>
        {`
          .member-empty-contribution {
            background-color: rgb(249 250 251);
            border-radius: 12px;
            font-size: 12px;
            padding: 12px;
            display: flex;
            gap: 8px;
            color: #000;
          }

          .member-empty-contribution__update {
            color: blue;
            padding: 0 5px;
          }
        `}
      </style>
    </>
  );
};

export default MemberEmptyProjectExperience;
