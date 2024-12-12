import { BreadCrumb } from '@/components/core/bread-crumb';
import Error from '@/components/core/error';
import { AdditionalDetails } from '@/components/page/project-details/additional-details';
import ContactInfos from '@/components/page/project-details/contact-infos';
import Contributors from '@/components/page/project-details/contributors';
import Description from '@/components/page/project-details/description';
import Header from '@/components/page/project-details/header';
import Hyperlinks from '@/components/page/project-details/hyper-links';
import KPIs from '@/components/page/project-details/kpis';
import TeamsInvolved from '@/components/page/project-details/teams-involved';
import { getProject } from '@/services/projects.service';
import { getAllTeams } from '@/services/teams.service';
import { hasProjectDeleteAccess, hasProjectEditAccess } from '@/utils/common.utils';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/types/shared.types';
import SelectedFocusAreas from '@/components/core/selected-focus-area';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { Metadata, ResolvingMetadata } from 'next';

export default async function ProjectDetails({ params }: any) {
  const projectId = params?.id;
  const { isError, userInfo, hasEditAccess, hasDeleteAccess, project, focusAreas, authToken } = await getPageData(projectId);

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
            <Description description={project?.description} project={project} userHasEditRights={hasEditAccess} user={userInfo}/>
          </div>

          {project?.projectLinks?.length > 0 && (
            <div className={styles.project__container__details__links}>
              <Hyperlinks project={project} user={userInfo} />
            </div>
          )}

          {/* Focus Areas */}
          {project?.projectFocusAreas && project?.projectFocusAreas?.length > 0 && focusAreas && focusAreas?.length > 0 && (
            <div className={styles?.project__container__details__focusarea}>
              <SelectedFocusAreas focusAreas={focusAreas} selectedFocusAreas={project.projectFocusAreas} />
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
          {project?.contributors?.length > 0 && (
            <div className={styles.project__container__info__contributors}>
              <Contributors project={project} contributors={project?.contributors} user={userInfo} />
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
  let project = null;
  let hasEditAccess = false;
  let hasDeleteAccess = false;
  let loggedInMemberTeams = [];
  let focusAreas: IFocusArea[] = [];

  try {
    const [projectResponse, focusAreaResponse] = await Promise.all([getProject(projectId, {}), getFocusAreas('Project', {})]);

    if (projectResponse?.error || focusAreaResponse?.error) {
      return {
        isError: true,
        isLoggedIn,
        userInfo,
        hasEditAccess,
        hasDeleteAccess,
        project,
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
    focusAreas = focusAreaResponse?.data?.filter((data: IFocusArea) => !data.parentUid);

    hasEditAccess = hasProjectEditAccess(userInfo, project, isLoggedIn, loggedInMemberTeams);
    hasDeleteAccess = hasProjectDeleteAccess(userInfo, project, isLoggedIn);

    return {
      isError,
      isLoggedIn,
      userInfo,
      hasEditAccess,
      hasDeleteAccess,
      project,
      focusAreas,
      authToken,
    };
  } catch (error) {
    return {
      isError: true,
      isLoggedIn,
      userInfo,
      hasEditAccess,
      hasDeleteAccess,
      project,
      focusAreas,
      authToken,
    };
  }
};


type IGenerateMetadata = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};
export async function generateMetadata({ params, searchParams }: IGenerateMetadata, parent: ResolvingMetadata): Promise<Metadata> {
  const projectId = params.id;
  const projectResponse = await getProject(projectId, {});
  if (projectResponse?.error) {
    return {
      title: 'Protocol Labs Directory',
      description:
        'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
      openGraph: {
        images: [
          {
            url: SOCIAL_IMAGE_URL,
            width: 1280,
            height: 640,
            alt: 'Protocol Labs Directory',
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        images: [SOCIAL_IMAGE_URL],
      },
    };
  }
  const project = projectResponse?.data?.formattedData;
  const previousImages = (await parent).openGraph?.images || [];
  const logo = project?.logo || SOCIAL_IMAGE_URL;
  return {
    title: `${project?.name} | Protocol Labs Directory`,
    openGraph: {
      type: 'website',
      url: `${process.env.APPLICATION_BASE_URL}${PAGE_ROUTES.TEAMS}/${projectId}`,
      images: [logo, ...previousImages],
    },
  };
}
