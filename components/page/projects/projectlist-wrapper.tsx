'use client';

import { VIEW_TYPE_OPTIONS } from '@/utils/constants';
import ProjectGridView from './project-grid-view';
import ProjectListView from './project-list-view';
import Link from 'next/link';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import ProjectAddCard from './project-add-card';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ListLoader } from '@/components/core/loaders/ListLoader';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInfiniteProjectsList } from '@/services/projects/hooks/useInfiniteProjectsList';
import { getAccessLevel } from '@/utils/auth.utils';

const ProjectlistWrapper = (props: any) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const projects = props?.projects ?? [];
  const userInfo = props?.userInfo;
  const totalProjects = props?.totalProjects;
  const isLoggedIn = props?.isLoggedIn;
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);

  const analytics = useProjectAnalytics();

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

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteProjectsList(
    {
      searchParams,
    },
    {
      initialData: { items: projects, total: totalProjects },
    },
  );

  const Loader = VIEW_TYPE_OPTIONS.GRID === viewType ? CardsLoader : ListLoader;

  return (
    <>
      <div className="project-list">
        <div className="project-list__titlesec">
          <h1 className="project-list__titlesec__title">Projects</h1> <div className="project-list__title__count">({totalProjects})</div>
        </div>
        <InfiniteScroll scrollableTarget="body" loader={null} hasMore={hasNextPage} dataLength={data.length} next={fetchNextPage} style={{ overflow: 'unset' }}>
          <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'project-list__grid' : 'project-list__list'}`}>
            {isLoggedIn && accessLevel === 'advanced' && totalProjects > 0 && <ProjectAddCard userInfo={userInfo} viewType={viewType} />}
            {data?.map((project: any, index: number) => (
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
            {isFetchingNextPage && <Loader />}
          </div>
        </InfiniteScroll>
      </div>

      <style jsx>{`
        .project-list {
          width: 100%;
        }

        .project-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          //position: sticky;
          //top: 150px;
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
            padding: 8px 0;
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
