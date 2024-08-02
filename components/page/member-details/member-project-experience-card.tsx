import { useMemberAnalytics } from '@/analytics/members.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { dateDifference, formatDate } from '@/utils/member.utils';
import MemberExperienceDescription from './member-experience-item';

const MemberProjectExperienceCard = (props: any) => {
  const experience = props?.experience;
  const userInfo = props?.userInfo;
  const member = props?.member;
  const logo = experience.project?.logo?.url ?? '/icons/default-project.svg';

  const analytics = useMemberAnalytics();

  const onProjectClickHandler = () => {
    analytics.onProjectClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), getAnalyticsProjectInfo(experience));
  };

  return (
    <>
      <div className="member-project-experience">
        {!experience?.project?.isDeleted && (
          <a target='_blank' className="member-project-experience__container" onClick={onProjectClickHandler} href={`${PAGE_ROUTES.PROJECTS}/${experience?.project?.uid}`}>
            <div className="member-project-experience__container__project">
              <img className="member-project-experience__container__project__img" loading="lazy" alt="project profile" src={logo} height={40} width={40} />
            </div>
            <div className="member-project-experience__project__desc">
              <Tooltip asChild trigger={<p className="member-project-experience__project__desc__name">{experience?.project?.name}</p>} content={experience?.project?.name} />
              {experience?.role && <p className="member-project-experience__project__desc__role">{experience?.role}</p>}
              {(experience?.startDate || experience?.endDate) && (
                <div className="member-project-experience__project__desc__date">
                  {experience?.startDate && <p>{formatDate(experience.startDate)}</p>}
                  {experience.currentProject && <p>{`- Present`}</p>}
                  {!experience.currentProject && experience.endDate && <p>{` - ${formatDate(experience.endDate)}`}</p>}
                  {experience.endDate && <p>{` (${dateDifference(new Date(experience.startDate), new Date(experience.endDate))})`}</p>}
                  {!experience.endDate && experience.startDate && <p>{` (${dateDifference(new Date(experience.startDate), new Date())})`}</p>}
                </div>
              )}
            </div>
          </a>
        )}

        {experience?.project?.isDeleted && (
          <Tooltip
            asChild
            trigger={
              <div className="member-project-experience__container">
                <div className="member-project-experience__container__project">
                  <img className="member-project-experience__container__project__img" loading="lazy" alt="project profile" src='/icons/deleted-project-logo.svg' height={40} width={40} />
                </div>
                <div className="member-project-experience__project__desc">
                  <p className="member-project-experience__project__desc__name">{experience?.project?.name}</p>
                  <p className="member-project-experience__project__desc__role">{experience?.role}</p>
                  <div className="member-project-experience__project__desc__date">
                    <p>{formatDate(experience.startDate)}</p>
                    {experience.currentProject && <p>{`- Present`}</p>}
                    {!experience.currentProject && experience.endDate && <p>{` - ${formatDate(experience.endDate)}`}</p>}
                    {experience.endDate && <p>{` (${dateDifference(new Date(experience.startDate), new Date(experience.endDate))})`}</p>}
                    {!experience.endDate && <p>{` (${dateDifference(new Date(experience.startDate), new Date())})`}</p>}
                  </div>
                </div>
              </div>
            }
            content={'This project has been deleted'}
          />
        )}

        {experience?.description && (
          <div className="member-project-experience__desc">
            <MemberExperienceDescription desc={experience.description} />
          </div>
        )}
      </div>
      <style jsx>
        {`
          .member-project-experience {
            display: flex;
            gap: 16px;
            flex-direction: column;
          }

          .member-project-experience__container {
            display: flex;
            gap: 16px;
          }
          .member-project-experience__container__project {
            display: flex;
          }

          .member-project-experience__container__project__img {
            border-radius:4px;
          }

          .member-project-experience__project__desc {
            font-size: 14px;
            display: flex;
            flex-wrap: wrap;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            width: 80%;
          }

          .member-project-experience__project__desc__name {
            color: #0f172a;
            font-weight: 600;
            white-space: nowrap;
            max-width: 250px;
            text-overflow: ellipsis;
            overflow: hidden;
            text-transform: capitalize;
          }
          .member-project-experience__project__desc__role {
            text-transform: upppercase;
            font-size: 12px;
            font-weight: 400;
            white-space: nowrap;
            max-width: 100px;
            text-overflow: ellipsis;
            overflow: hidden;
            color: #475569;
          }

          .member-project-experience__project__desc__date {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            flex-wrap: wrap;
            display: flex;
            gap: 5px;
            align-items: center;
          }
          @media (min-width: 1024px) {
            .member-project-experience__project__desc__name {
              max-width: 80%;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberProjectExperienceCard;
