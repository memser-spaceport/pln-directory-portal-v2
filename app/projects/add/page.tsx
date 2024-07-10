import { BreadCrumb } from '@/components/core/bread-crumb';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import styles from './page.module.css';
import Error from '@/components/core/error';
import { getMembers } from '@/services/members.service';
import { getAllTeams } from '@/services/teams.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export default function AddProject(props: any) {
  const {isError} =  getPageData();

  
  if(isError) {
    <Error/>
  }


  return (
    <div className={styles?.addProject}>
      <div className={styles.addProject__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="project" pageName="Add Project" />
      </div>
      <div>
        <AddEditProjectContainer project={null} />
      </div>
    </div>
  );
}


function getPageData() {
  const isError = false;
  const {isLoggedIn} = getCookiesFromHeaders();
  try {

    // const {mebersResponse, teamResponse} = await Promise.all([getMembers({pagination: false, }, "", 0, 0, isLoggedIn), getAllTeams()])

    return {
      isError
    }
  } catch (error) {
    console.error(error);
    return {
      isError: true
    }
  }
}