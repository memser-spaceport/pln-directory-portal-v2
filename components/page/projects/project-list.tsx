"use client";

import usePagination from "../../../hooks/usePagination";
import { useState, useRef, useEffect } from "react";
import ProjectGridView from "./project-grid-view";
import { useRouter } from "next/navigation";
import ProjectAddCard from "./project-add-card";
import ProjectListView from "./project-list-view";
import Link from "next/link";
import { VIEW_TYPE_OPTIONS } from "@/utils/constants";

const ProjectList = (props: any) => {
  //props
  const searchParams = props.searchParams;
  const projects = props.projects;
  const totalProjects = props.totalProjects;
  const userInfo = props.userInfo;

  //state
  const [projectList, setProjectList] = useState(projects);
  const router = useRouter();

  //variables
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const observerTarget = useRef(null);
  // const { currentPage, limit, setPagination } = usePagination({
  //   observerTargetRef: observerTarget,
  //   totalItems: totalProjects,
  //   totalCurrentItems: projectList?.length,
  // });
  // const analytics = useProjectListAnalytics();

  //methods
  // const getProjects = async () => {
  //   try {
  //     const optionsFromQuery = CommonUtils.getProjectsFiltersFromQuery(searchParams);
  //     const listOptions = CommonUtils.getProjectSelectOptions(optionsFromQuery);
  //     const result = await getAllProjects(listOptions, currentPage, 15);
  //     if (result?.error) {
  //       return;
  //     }
  //     setProjectList((prev: any) => [...prev, ...(result?.data?.formattedData || [])]);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     CommonUtils.triggerLoader(false);
  //   }
  // };

  // const onNavigateToProject = (project: IProjectListData) => {
  //   CommonUtils.triggerLoader(true);
  //   analytics.onProjectClicked(CommonUtils.getAnalyticsUserInfo(userInfo), project);
  // };

  // useEffect(() => {
  //   if (currentPage !== 1) {
  //     CommonUtils.triggerLoader(true);
  //     getProjects();
  //   }
  // }, [currentPage]);

  // useEffect(() => {
  //   setPagination({ page: 1, limit: 100 });
  //   setProjectList(projects);
  // }, [projects]);

  return (
    <div className="project-list">
      <div
        className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? "project-list__grid" : "project-list__list"}`}
      >
        {userInfo && <ProjectAddCard viewType={viewType} />}
        {projectList?.map((project: any, index: number) => (
          <Link
            href={`/projects/${project.id}`}
            key={`${project} + ${index}`}
            prefetch={false}
            className={`project-list__project ${
              VIEW_TYPE_OPTIONS.GRID === viewType
                ? "project-list__grid__project"
                : "project-list__list__project"
            }`}
            // onClick={() => onNavigateToProject(project)}
          >
            {VIEW_TYPE_OPTIONS.GRID === viewType && (
              <ProjectGridView project={project} viewType={viewType} />
            )}
            {VIEW_TYPE_OPTIONS.LIST === viewType && (
              <ProjectListView project={project} viewType={viewType} />
            )}
            {/* <ProjectGridView project={project} viewType={viewType} /> */}
          </Link>
        ))}
        <div ref={observerTarget}></div>
      </div>
      <style jsx>{`
        .project-list {
          width: 100%;
        }

        .project-list__project {
          cursor: pointer;
        }

        .project-list__grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
          justify-content: center;
        }

        .project-list__list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .project-list__list__project {
          width: 100%;
          padding: 0px 16px;
        }

        @media (min-width: 1024px) {
          .project-list__list__project {
            padding: 0px 0px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectList;
