import { BreadCrumb } from '@/components/core/bread-crumb';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import styles from './page.module.css';

export default function AddProject(props: any) {
  return (
    <div className={styles?.addProject}>
      <div className={styles.addProject__breadcrumb}>
        <BreadCrumb backLink="/projects" directoryName="project" pageName="Add Project" />
      </div>
      <div>
        {/* <AddEditProjectContainer project={null} /> */}
      </div>
    </div>
  );
}
