'use client';

import { VIEW_TYPE_OPTIONS } from '@/utils/constants';
import ProjectGridView from './project-grid-view';
import ProjectListView from './project-list-view';
import Link from 'next/link';
import ProjectList from './project-list';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProjectlistWrapper = (props: any) => {
  const searchParams = props?.searchParams;
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const projects = props?.projects ?? [];
  const userInfo = props?.userInfo;

  const analytics = useProjectAnalytics();
  const router = useRouter();

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

  return (
    <>
      <ProjectList {...props}>
        {projects?.map((project: any, index: number) => (
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
      </ProjectList>
    </>
  );
};

export default ProjectlistWrapper;
