'use client';

import { ITEMS_PER_PAGE, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import ProjectGridView from './project-grid-view';
import ProjectListView from './project-list-view';
import Link from 'next/link';
import ProjectList from './project-list';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import usePagination from '@/hooks/irl/use-pagination';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import ProjectAddCard from './project-add-card';
import TableLoader from '@/components/core/table-loader';
import { getAllProjects } from '@/app/actions/projects.actions';

const ProjectlistWrapper = (props: any) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const projects: any[] = props?.projects ?? [];
  const userInfo = props?.userInfo;
  const totalProjects = props?.totalProjects;
  const isLoggedIn = props?.isLoggedIn;

  const [allProjects, setAllProjects] = useState<any[]>([...projects]);

  const analytics = useProjectAnalytics();
  const router = useRouter();
  const paginationRef = useRef(null);
  const [isloading, setIsLoading] = useState(false);

  const { currentPage, limit, setPagination } = usePagination({
    observerTargetRef: paginationRef,
    totalItems: totalProjects,
    totalCurrentItems: allProjects?.length,
  });

  const onNavigateToProject = (e: any, project: any) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onProjectClicked(getAnalyticsUserInfo(userInfo), {
      projectUid: project.id,
      projectName: project.name,
      from: 'project-list',
    });
  };

  useEffect(() => {
    triggerLoader(false);
  }, [router, searchParams]);

  const getProjects = async () => {
    try {
      setIsLoading(true);
      const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
      const selectOpitons = getProjectSelectOptions(filterFromQuery);

      const projectsResponse = await getAllProjects(
        { ...selectOpitons, isDeleted: false, select: 'uid,name,tagline,logo.url,description,lookingForFunding,maintainingTeam.name,maintainingTeam.logo.url' },
        currentPage,
        ITEMS_PER_PAGE
      );
      if (!projectsResponse?.error) {
        setIsLoading(false);
        setAllProjects([...allProjects, ...projectsResponse?.data?.formattedData]);
        return;
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  useEffect(() => {
    if (currentPage !== 1) {
      getProjects();
    }
  }, [currentPage]);

  // Sync  eventDetails changes
  useEffect(() => {
    setPagination({ page: 1, limit: 10 });
    setAllProjects([...projects]);
  }, [projects]);

  return (
    <>
      <div className="project-list">
        <div className="project-list__titlesec">
          <h1 className="project-list__titlesec__title">Projects</h1> <div className="project-list__title__count">({totalProjects})</div>
        </div>
        <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'project-list__grid' : 'project-list__list'}`}>
          {isLoggedIn && totalProjects > 0 && <ProjectAddCard userInfo={userInfo} viewType={viewType} />}
          {allProjects?.map((project: any, index: number) => (
            <Link
              href={`/projects/${project.id}`}
              key={`projectitem-${project.id}-${index}`}
              prefetch={false}
              className={`project-list__project ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'project-list__grid__project' : 'project-list__list__project'}`}
              onClick={(e) => onNavigateToProject(e, project)}
            >
              {VIEW_TYPE_OPTIONS.GRID === viewType && <ProjectGridView project={project} viewType={viewType} />}
              {VIEW_TYPE_OPTIONS.LIST === viewType && <ProjectListView project={project} viewType={viewType} />}
            </Link>
          ))}
          <div ref={paginationRef} />
        </div>
      </div>
      {isloading && <TableLoader />}

      <style jsx>{`
        .project-list {
          width: 100%;
        }

        .project-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          position: sticky;
          top: 150px;
          z-index: 3;
          background: #f1f5f9;
        }

        .project-list__titlesec__title {
          font-size: 24px;
          line-height: 40px;
          font-weight: 700;
          color: #0f172a;
        }

        .project-list__title__count {
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
        }

        .project-list__project {
          cursor: pointer;
        }

        .project-list__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 167.5px);
          justify-content: center;
          row-gap: 16px;
          column-gap: 16px;
          padding: 5px 8px;
        }

        .project-list__list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          padding: 5px 8px;
        }

        .project-list__list__project {
          width: 100%;
          padding: 0px 16px;
        }

        @media (min-width: 1024px) {
          .project-list__list__project {
            padding: 0px 0px;
          }

          .project-list__grid {
            grid-template-columns: repeat(auto-fit, 289px);
          }

          .project-list__titlesec {
            display: none;
          }

          .project-list__grid {
            padding: unset;
          }

          .project-list__list {
            padding: unset;
          }
        }
      `}</style>
    </>
  );
};

export default ProjectlistWrapper;
