import ProjectList from '@/components/page/projects/project-list';
import styles from './page.module.css';
import { getAllProjects } from '@/services/projects.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import ProjectsToolbar from '@/components/page/projects/project-toolbar';
import ProjectFilter from '@/components/page/projects/project-filter';
import Error from '@/components/core/error';
import EmptyResult from '@/components/core/empty-result';

export default async function Page({ searchParams }: any) {
  const { projects, isError, totalProjects, userInfo } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }


  return (
    <section className={styles.project}>
      <aside className={styles.project__filter}>
        <div className={styles.project__filter__web}>
          <ProjectFilter searchParams={searchParams} userInfo={userInfo} />
        </div>
        <div className={styles.project__filter__mob}>
          {/* <ProjectFilterMobile userInfo={userInfo} /> */}
        </div>
      </aside>
      <div className={styles.project__cn}>
        <div className={styles.project__cn__toolbar}>
          <ProjectsToolbar searchParams={searchParams} totalProjects={totalProjects} userInfo={userInfo} />
        </div>
        <div className={styles.project__cn__list}>
          <ProjectList searchParams={searchParams} totalProjects={totalProjects} projects={projects} userInfo={userInfo} />
          {totalProjects === 0 && <EmptyResult />}
        </div>
      </div>
    </section>
  );
}

const getPageData = async (searchParams: any) => {
  let isError = false;
  try {
    const { userInfo } = getCookiesFromHeaders();
    const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
    const selectOpitons = getProjectSelectOptions(filterFromQuery);
    const [projectsResponse] = await Promise.all([getAllProjects(selectOpitons, 0, 0)]);
    if (projectsResponse?.error) {
      isError = true;
      return { isError };
    }
    return {
      projects: projectsResponse.data?.formattedData ?? [],
      totalProjects: projectsResponse.data?.totalProjects ?? 0,
      userInfo,
    };
  } catch (error) {
    isError = true;
    return { isError };
  }
};
