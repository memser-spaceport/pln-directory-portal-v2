import { BreadCrumb } from '@/components/core/bread-crumb';
import Error from '@/components/core/error';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import { getProject } from '@/services/projects.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { PAGE_ROUTES } from '@/utils/constants';
import { RedirectType, redirect } from 'next/navigation';

export default async function EditProject({ params }: any) {
  const projectId = params.id;
  const { isError, project, isLoggedIn, userInfo } = await getPageData(projectId);

  if (!isLoggedIn) {
    redirect(`${PAGE_ROUTES.HOME}`, RedirectType.replace);
  }
  if (isError) {
    <Error />;
  }
  return (
    <div className={styles?.editProject}>
      <div className={styles.editProject__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="Project" pageName="Edit Project" />
      </div>
        <div className={styles.editProject__cnt}>
        <AddEditProjectContainer project={project} type="Edit"  userInfo={userInfo}/>
      </div>
    </div>
  );
}

async function getPageData(projectId: string) {
  const isError = false;
  const { isLoggedIn, userInfo} = getCookiesFromHeaders();
  let project = null;
  try {
    const [projectResponse] = await Promise.all([getProject(projectId, {})]);
    if (projectResponse?.error) {
      return { isError: true, project, isLoggedIn, userInfo };
    }
    const result: any = projectResponse.data.formattedData;
    project = { ...result, contributions: result?.contributors, maintainingTeam: {...result?.maintainingTeam, logo: result?.maintainingTeam?.logo?.url  }};

    return {
      isError,
      project,
      isLoggedIn,
      userInfo
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      project,
      isLoggedIn,
      userInfo
    };
  }
}
