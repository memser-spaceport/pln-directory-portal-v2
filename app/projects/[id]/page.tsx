import Error from '@/components/core/error';
import { getMembers } from '@/services/members.service';
import { getProject } from '@/services/projects.service';
import { getAllTeams } from '@/services/teams.service';
import { hasProjectDeleteAccess, hasProjectEditAccess } from '@/utils/common.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { BreadCrumb } from '@/components/core/bread-crumb';
import Header from '@/components/page/project-details/header';
import Description from '@/components/page/project-details/description';
import Hyperlinks from '@/components/page/project-details/hyper-links';
import KPIs from '@/components/page/project-details/kpis';
import { AdditionalDetails } from '@/components/page/project-details/additional-details';
import Contributors from '@/components/page/project-details/contributors';
import TeamsInvolved from '@/components/page/project-details/teams-involved';
import ContactInfos from '@/components/page/project-details/contact-infos';

export default async function ProjectDetails({ params }: any) {
  const projectId = params?.id;
  const { isError, isLoggedIn, userInfo, hasEditAccess, hasDeleteAccess, project, contributors, authToken } = await getPageData(projectId);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.project}>
      <div className={styles.project__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="Projects" pageName={project?.name ?? ''} />
      </div>
      <div className={styles.project__container}>
        <div className={styles.project__container__details}>
          <div className={styles.project__container__details__primary}>
            <Header project={project} userHasEditRights={hasEditAccess} userHasDeleteRights={hasDeleteAccess} user={userInfo} authToken={authToken} />
            <Description description={project?.description} />
          </div>

          {project?.projectLinks?.length > 0 && (
            <div className={styles.project__container__details__links}>
              <Hyperlinks project={project} user={userInfo} />
            </div>
          )}

          {project?.kpis.length > 0 && (
            <div className={styles.project__container__details__kpis}>
              <KPIs kpis={project?.kpis} />
            </div>
          )}

          <div className={styles.project__container__details__additionalDetails}>
            <AdditionalDetails project={project} userHasEditRights={hasEditAccess} authToken={authToken} user={userInfo} />
          </div>
        </div>
        <div className={styles.project__container__info}>
          {(project?.contributors.length > 0 || contributors.length > 0) && (
            <div className={styles.project__container__info__contributors}>
              <Contributors contributors={project?.contributors} contributingMembers={contributors} user={userInfo} />
            </div>
          )}
          <div className={styles.project__container__info__teams}>
            <TeamsInvolved project={project} user={userInfo} />
          </div>
          {project?.contactEmail && (
            <div className={styles.project__container__info__contacts}>
              <ContactInfos contactEmail={project?.contactEmail} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getPageData = async (projectId: string) => {
  let isError = false;
  const { authToken, isLoggedIn, userInfo } = getCookiesFromHeaders();
  let contributors: any = [];
  let project = null;
  let hasEditAccess = false;
  let hasDeleteAccess = false;
  let loggedInMemberTeams = [];

  try {
    const [projectResponse, contributorsResponse] = await Promise.all([
      getProject(projectId, {}),
      getMembers(
        {
          'projectContributions.projectUid': projectId + '',
          select: 'uid,name,image,teamMemberRoles.team,teamMemberRoles.mainTeam,teamMemberRoles.role,teamMemberRoles.teamLead',
          pagination: false,
        },
        '',
        0,
        0,
        isLoggedIn
      ),
    ]);

    if (projectResponse?.error || contributorsResponse?.error) {
      return {
        isError: true,
        isLoggedIn,
        userInfo,
        hasEditAccess,
        hasDeleteAccess,
        project,
        contributors,
        authToken,
      };
    }

    if (isLoggedIn) {
      const allTeams = await getAllTeams(
        authToken,
        {
          'teamMemberRoles.member.uid': userInfo.uid,
          select: 'uid,name,logo.url,industryTags.title,teamMemberRoles.role,teamMemberRoles.mainTeam,officeHours',
          pagination: false,
        },
        0,
        0
      );
      if (!allTeams?.error) {
        loggedInMemberTeams = allTeams?.data?.formattedData ?? [];
      }
    }

    project = projectResponse?.data?.formattedData;
    contributors = contributorsResponse?.data?.formattedData ?? [];

    hasEditAccess = hasProjectEditAccess(userInfo, project, isLoggedIn, loggedInMemberTeams);
    hasDeleteAccess = hasProjectDeleteAccess(userInfo, project, isLoggedIn);

    return {
      isError,
      isLoggedIn,
      userInfo,
      hasEditAccess,
      hasDeleteAccess,
      project,
      authToken,
      contributors,
    };
  } catch (error) {
    return {
      isError: true,
      isLoggedIn,
      userInfo,
      hasEditAccess,
      hasDeleteAccess,
      project,
      authToken,
      contributors,
    };
  }
};
