import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';

interface IMemberEmptyProject {
  userInfo: IUserInfo;
  member: IMember;
  profileType: string;
}

const MemberEmptyProject = (props: IMemberEmptyProject) => {
  const userInfo = props?.userInfo;
  const member = props?.member;

  const isOwner = userInfo.uid === member.id;
  const isAdmin = userInfo.roles && userInfo.roles?.length > 0 && userInfo.roles.includes(ADMIN_ROLE);

  const analytics = useMemberAnalytics();

  const onUpdateGithub = () => {
    analytics.onUpdateGitHubHandle(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  return (
    <>
      <>
        {isOwner && member?.githubHandle ? (
          <div className="member-empty-project">
            <p>No repositories to display</p>
          </div>
        ) : (
          <>
            {isOwner && member?.githubHandle == null ? (
              <div className="member-empty-project">
                <p>
                  GitHub handle is missing. Please update your profile
                  <a onClick={onUpdateGithub} href={`${PAGE_ROUTES.SETTINGS}/profile`} className="member-empty-project__update">
                    here
                  </a>
                </p>
              </div>
            ) : (
              <>
                {isOwner || isAdmin ? (
                  <>
                    {member?.githubHandle == null ? (
                      <div className="member-empty-project">
                        <p>
                          GitHub handle is missing for the user. If you have the required information, please update
                          <a onClick={onUpdateGithub} href={`${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}`} className="member-empty-project__update">
                            here
                          </a>
                        </p>
                      </div>
                    ) : (
                      <>
                        {member?.githubHandle ? (
                          <div className="member-empty-project">
                            <p>No repositories to display</p>
                          </div>
                        ) : (
                          <div className="member-empty-project">
                            <p>
                              GitHub handle is missing. Please update your profile
                              <a onClick={onUpdateGithub} href={`${PAGE_ROUTES.SETTINGS}/profile`} className="member-empty-project__update">
                                here
                              </a>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="member-empty-project">
                    <p>No repositories to display</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </>

      <style jsx>
        {`
          .member-empty-project {
            background-color: rgb(249 250 251);
            border-radius: 12px;
            font-size: 12px;
            padding: 12px;
            display: flex;
            gap: 8px;
            color: #000;
          }

          .member-empty-project__update {
            color: blue;
            padding: 0 5px;
          }
        `}
      </style>
    </>
  );
};

export default MemberEmptyProject;
