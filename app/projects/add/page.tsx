import { BreadCrumb } from '@/components/core/bread-crumb';
import Error from '@/components/core/error';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { RedirectType, redirect } from 'next/navigation';
import { PAGE_ROUTES } from '@/utils/constants';

export default function AddProject(props: any) {
  const { isError, isLoggedIn, userInfo} = getPageData();

  if(!isLoggedIn) {
      redirect(`${PAGE_ROUTES.HOME}`, RedirectType.replace);
  }

  if (isError) {
    <Error />;
  }

  return (
    <div className={styles?.addProject}>
      <div className={styles.addProject__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="Project" pageName="Add Project" />
      </div>
      <div className={styles.addProject__cnt}>
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
