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
  const { isError, project, isLoggedIn } = await getPageData(projectId);

  if (!isLoggedIn) {
    redirect(`${PAGE_ROUTES.TEAMS}`, RedirectType.replace);
  }
  if (isError) {
    <Error />;
  }
  return (
    <div className={styles?.addProject}>
      <div className={styles.addProject__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="project" pageName="Add Project" />
      </div>
      <div>
        <AddEditProjectContainer project={project} type="Edit" />
      </div>
    </div>
  );
}

async function getPageData(projectId: string) {
  const isError = false;
  const { isLoggedIn } = getCookiesFromHeaders();
  let project = null;
  try {
    const [projectResponse] = await Promise.all([getProject(projectId, {})]);
    if (projectResponse?.error) {
      return { isError: true, project, isLoggedIn };
    }
    const result: any = projectResponse.data.formattedData;
    project = { ...result, contributions: result?.contributors };

    return {
      isError,
      project,
      isLoggedIn,
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      project,
      isLoggedIn,
    };
  }
}