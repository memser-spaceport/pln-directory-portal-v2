'use client';

import { VIEW_TYPE_OPTIONS } from '@/utils/constants';
import ProjectGridView from './project-grid-view';
import ProjectListView from './project-list-view';
import Link from 'next/link';
import ProjectList from './project-list';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

const ProjectlistWrapper = (props: any) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const projects = props?.projects ?? [];
  const userInfo = props?.userInfo;

  const analytics = useProjectAnalytics();

  const onNavigateToProject = (project: any) => {
    triggerLoader(true);
    analytics.onProjectClicked(getAnalyticsUserInfo(userInfo), {
      projectUid: project.id,
      projectName: project.name,
      from: 'project-list',
    });
  };

  return (
    <>
      <ProjectList {...props}>
        {projects?.map((project: any, index: number) => (
          <Link
            href={`/projects/${project.id}`}
            key={`${project} + ${index}`}
            prefetch={false}
            className={`project-list__project ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'project-list__grid__project' : 'project-list__list__project'}`}
            onClick={() => onNavigateToProject(project)}
          >
            {VIEW_TYPE_OPTIONS.GRID === viewType && <ProjectGridView project={project} viewType={viewType} />}
            {VIEW_TYPE_OPTIONS.LIST === viewType && <ProjectListView project={project} viewType={viewType} />}
          </Link>
        ))}
      </ProjectList>
    </>
  );
};

export default ProjectlistWrapper;
