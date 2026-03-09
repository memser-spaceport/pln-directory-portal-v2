import { useMemberAnalytics } from '@/analytics/members.analytics';
import { PAGE_ROUTES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/utils/user/isAdminUser';

interface IMemberEmptyProjectExperience {
  userInfo: any;
  member: any;
  profileType: string;
}

const MemberEmptyProjectExperience = (props: IMemberEmptyProjectExperience) => {
  const userInfo = props?.userInfo;
  const member = props?.member;
  const router = useRouter();

  const isOwner = userInfo.uid === member.id;
  const isAdmin = isAdminUser(userInfo);

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
            <a
              href={
                isAdmin && !isOwner
                  ? `${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}`
                  : `${PAGE_ROUTES.SETTINGS}/profile`
              }
              className="member-empty-contribution__update"
              onClick={onEditOrAdd}
            >
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
