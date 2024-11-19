import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IMember, IMemberRepository } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

interface IMemberRepoCard {
  repo: IMemberRepository;
  userInfo: IUserInfo;
  memebr: IMember;
}

/**
 * MemberDetailsRepoCard component displays a repository card with details about a member's repository.
 * It includes the repository name, description, and a link to the repository.
 * 
 * @component
 * @param {IMemberRepoCard} props - The properties object.
 * @param {Object} props.repo - The repository information.
 * @param {string} props.repo.name - The name of the repository.
 * @param {string} props.repo.description - The description of the repository.
 * @param {string} props.repo.url - The URL of the repository.
 * @param {Object} props.userInfo - The user information.
 * @param {Object} props.memebr - The member information (note: there is a typo in the prop name, it should be `member`).
 * @param {string} props.memebr.name - The name of the member.
 * @param {string} props.memebr.id - The ID of the member.
 * 
 * @returns {JSX.Element} The rendered component.
 */
const MemberDetailsRepoCard = (props: IMemberRepoCard) => {
  const repo = props?.repo;
  const userInfo = props?.userInfo;
  const member = props.memebr;
  const profile = '/icons/repository.svg';

  const analytics = useMemberAnalytics();

  const onRepoClickHandler = () => {
    analytics.onGithubProjectItemClicked(
      {
        name: member?.name,
        uid: member?.id,
        projectName: repo?.name,
        url: repo?.url,
      },
      getAnalyticsUserInfo(userInfo)
    );
  };

  return (
    <>
      <a href={repo?.url} target="_blank" className="member-repo" onClick={onRepoClickHandler}>
        <div className="member-repo__profile-container">
          <div className="member-repo__profile-container__profile">
            <img loading="lazy" src={profile} height={40} width={34} />
          </div>

          <div className="member-repo__profile-container__details">
            <h3 className="member-repo__profile-container__details__project-name">{repo?.name}</h3>
            <p className="member-repo__profile-container__details__desc">{repo?.description ?? '-'}</p>
          </div>
        </div>

        <button className="member-repo__goto__btn">
          <img loading="lazy" alt="go-to" src="/icons/right-arrow-gray.svg" width={16} height={14} />
        </button>
      </a>

      <style jsx>
        {`
          .member-repo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
          }

          .member-repo__profile-container {
            display: flex;
            align-items: center;
            gap: 16px;
            width:100%;
          }
          .member-repo__profile-container__details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width:100%;
          }

          .member-repo__profile-container__details__project-name {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            color: #000;
            letter-spacing: 0em;
            text-align: left;
            width: 80%;
            word-break: break-word;
          }

          .member-repo__profile-container__details__desc {
            font-size: 12px;
            font-weight: 400;
            line-height: 14px;
            letter-spacing: 0em;
            text-align: left;
            color: #475569;
            width: 80%;
            word-break: break-word;
          }

          .member-repo__goto__btn {
            background: transparent;
          }
        `}
      </style>
    </>
  );
};

export default MemberDetailsRepoCard;
