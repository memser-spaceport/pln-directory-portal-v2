import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import ProjectsToolbar from '@/components/page/projects/project-toolbar';
import Error from '@/components/core/error';
import EmptyResult from '@/components/core/empty-result';
import ProjectlistWrapper from '@/components/page/projects/projectlist-wrapper';
import FilterWrapper from '@/components/page/projects/filter-wrapper';
import { getFocusAreas } from '@/services/common.service';
import { URL_QUERY_VALUE_SEPARATOR, SOCIAL_IMAGE_URL, ITEMS_PER_PAGE } from '@/utils/constants';
import { Metadata } from 'next';
import { getTeam, searchTeamsByName } from '@/services/teams.service';
import { getAllProjects } from '../actions/projects.actions';

export default async function Page({ searchParams }: any) {
  const { projects, initialTeams, selectedTeam, isError, totalProjects, userInfo, focusAreas, isLoggedIn } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <section className={styles.project}>
      <aside className={styles.project__filter}>
        <FilterWrapper initialTeams={initialTeams} selectedTeam={selectedTeam} searchParams={searchParams} userInfo={userInfo} focusAreas={focusAreas} />
      </aside>
      <div className={styles.project__cn}>
        <div className={styles.project__cn__toolbar}>
          <ProjectsToolbar searchParams={searchParams} totalProjects={totalProjects} userInfo={userInfo} />
        </div>
        <div className={styles.project__cn__list}>
          <ProjectlistWrapper searchParams={searchParams} totalProjects={totalProjects} projects={projects} userInfo={userInfo} isLoggedIn={isLoggedIn}/>
          {totalProjects === 0 && <EmptyResult isLoggedIn={isLoggedIn} />}
        </div>
      </div>
    </section>
  );
}

const getPageData = async (searchParams: any) => {
  let isError = false;
  let selectedTeam = { label: '', value: '', logo: '' }
  let initialTeams = [];

  
  try {
    const { userInfo, isLoggedIn } = getCookiesFromHeaders();
    const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
    const selectOpitons = getProjectSelectOptions(filterFromQuery);
    const [projectsResponse, focusAreasResponse] = await Promise.all([getAllProjects({...selectOpitons, isDeleted: false,
      select: "uid,name,tagline,logo.url,description,lookingForFunding,maintainingTeam.name,maintainingTeam.logo.url"
    }, 1, ITEMS_PER_PAGE), getFocusAreas('Project', searchParams)]);
    if (projectsResponse?.error || focusAreasResponse?.error) {
      isError = true;
      return { isError };
    }

    if(searchParams["team"]) {
        const teamResponse = await getTeam(searchParams["team"], {
          with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member',
        });
        if (!teamResponse.error) {
          const formattedTeam = teamResponse?.data?.formatedData;
          selectedTeam = ({ label: formattedTeam?.name, value: formattedTeam?.id, logo: formattedTeam?.logo }); 
        }
    }

    const result = await searchTeamsByName(selectedTeam.label);
    if(!result.error) {
      initialTeams = result;
    }

    const focusAreaQuery = searchParams?.focusAreas;
    const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR);
    const selectedFocusAreas = focusAreaFilters?.length > 0 ? focusAreasResponse?.data?.filter((focusArea: any) => focusAreaFilters?.includes(focusArea?.title)) : [];

    return {
      projects: projectsResponse.data?.formattedData ?? [],
      totalProjects: projectsResponse.data?.totalProjects ?? 0,
      userInfo,
      focusAreas: {
        rawData: focusAreasResponse?.data || [],
        selectedFocusAreas,
      },
      isLoggedIn,
      selectedTeam,
      initialTeams,
    };
  } catch (error) {
    isError = true;
    console.error(error);
    return { isError };
  }
};

export const metadata: Metadata = {
  title: 'Projects | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
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
