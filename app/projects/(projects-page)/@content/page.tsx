import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import ProjectsToolbar from '@/components/page/projects/project-toolbar';
import Error from '@/components/core/error';
import EmptyResult from '@/components/core/empty-result';
import ProjectlistWrapper from '@/components/page/projects/projectlist-wrapper';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import { getAllProjects } from '@/app/actions/projects.actions';

export default async function Page({ searchParams }: any) {
  const { projects, isError, totalProjects, userInfo, isLoggedIn } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.project__cn}>
      <div className={styles.project__cn__toolbar}>
        <ProjectsToolbar searchParams={searchParams} totalProjects={totalProjects} userInfo={userInfo} />
      </div>
      <div className={styles.project__cn__list}>
        <ProjectlistWrapper
          searchParams={searchParams}
          totalProjects={totalProjects}
          projects={projects}
          userInfo={userInfo}
          isLoggedIn={isLoggedIn}
        />
        {totalProjects === 0 && <EmptyResult isLoggedIn={isLoggedIn} />}
      </div>
    </div>
  );
}

const getPageData = async (searchParams: any) => {
  let isError = false;

  try {
    const { userInfo, isLoggedIn } = getCookiesFromHeaders();
    const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
    const selectOptions = getProjectSelectOptions(filterFromQuery);
    const projectsResponse = await getAllProjects(
      {
        ...selectOptions,
        isDeleted: false,
        select:
          'uid,name,tagline,tags,logo.url,description,lookingForFunding,maintainingTeam.name,maintainingTeam.logo.url',
      },
      1,
      INITIAL_ITEMS_PER_PAGE,
    );

    if (projectsResponse?.error) {
      isError = true;
      return { isError };
    }

    return {
      projects: projectsResponse.data?.formattedData ?? [],
      totalProjects: projectsResponse.data?.totalProjects ?? 0,
      userInfo,
      isLoggedIn,
    };
  } catch (error) {
    isError = true;
    console.error(error);
    return { isError };
  }
};
