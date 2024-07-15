import { BreadCrumb } from '@/components/core/bread-crumb';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import styles from './page.module.css';
import Error from '@/components/core/error';
import { getMembers } from '@/services/members.service';
import { getAllTeams } from '@/services/teams.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { RedirectType, redirect } from 'next/navigation';
import { PAGE_ROUTES } from '@/utils/constants';

export default function AddProject(props: any) {
  const { isError, isLoggedIn, userInfo} = getPageData();

  if(!isLoggedIn) {
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
        <AddEditProjectContainer project={null} type="Add" userInfo={userInfo}/>
      </div>
    </div>
  );
}

function getPageData() {
  const isError = false;
  const { isLoggedIn, userInfo} = getCookiesFromHeaders();
  try {
    return {
      isLoggedIn, userInfo
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      userInfo
    };
  }
}
