import LandingFocusAreas from '@/components/page/home/landing-focus-areas';
import styles from './page.module.css';
import { getFocusAreas } from '@/services/common.service';
import { IFocusArea } from '@/components/page/team-form-info/focus-area/focus-area';
import Error from '@/components/core/error';

const Home = async () => {
    const {isError, focusAreas} =  await getPageData();

    if(isError) {
        return <Error/>
    }
  return (
    <div className={styles?.home}>
      <div className={styles?.home__body}>
        <LandingFocusAreas focusAreas={focusAreas}/>
      </div>
    </div>
  );
};

const getPageData = async () => {
  let isError = false;
  let teamFocusAreas: IFocusArea[] = [];
  let projectFocusAreas: IFocusArea[]= [];
  
  try {
    const [teamFocusAreaResponse, projectFocusAreaResponse] = await Promise.all([getFocusAreas('Team', {}), getFocusAreas('Project', {})]);

    if (teamFocusAreaResponse?.error || projectFocusAreaResponse?.error) {
      return {
        isError: true,
        focusAreas: {
            teamFocusAreas,
            projectFocusAreas
        }
      };
    }

    teamFocusAreas  = Array.isArray(teamFocusAreaResponse?.data) ?  teamFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid) : [];
    projectFocusAreas = Array.isArray(projectFocusAreaResponse?.data) ? projectFocusAreaResponse?.data?.filter((data: any) => !data?.parentUid) : [];

    return {
        isError,
        focusAreas: {
            teamFocusAreas ,
            projectFocusAreas
        }

    }
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      focusAreas: {
        teamFocusAreas,
        projectFocusAreas
      }
    };
  }
};

export default Home;
