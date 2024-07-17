import { IFormatedTeamProject } from "@/types/teams.types";
import { EVENTS, PAGE_ROUTES } from "@/utils/constants";
import Image from "next/image";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import TeamProjectCard from "./team-project-card";

interface IAllProjects {
  projects: IFormatedTeamProject[];
  hasProjectsEditAccess: boolean;
  onCardClicked: (project: any) => void;
  onEditClicked: any;
}
const AllProjects = (props: IAllProjects) => {
  const projects = props?.projects ?? [];
  const hasProjectsEditAccess = props?.hasProjectsEditAccess;
  const [allProjects, setAllProjects] = useState(projects);
  const callback = props?.onCardClicked;
  const [searchValue, setSearchValue] = useState("");

  const onEditClicked = props?.onEditClicked;

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchValue(name);
    if (name) {
      const filteredProjects = allProjects?.filter((project: IFormatedTeamProject) => project?.name?.toLowerCase()?.includes(name));
      setAllProjects(filteredProjects);
    } else {
      setAllProjects(projects);
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.TEAM_DETAIL_ALL_PROJECTS_CLOSE, ((e: any) => {
      setAllProjects(projects);
      setSearchValue("");
    }));
    document.removeEventListener(EVENTS.TRIGGER_LOADER, () => {});
  }, []);

  return (
    <>
      <div className="all-projects">
        <h2 className="all-projects__title">Projects ({projects?.length})</h2>
        <div className="all-projects__search-bar">
          <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
          <input value={searchValue} className="all-projects__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="all-projects__projects">
          {allProjects?.map((project: IFormatedTeamProject, index: number) => {
            return (
              <Fragment key={`${project} + ${index}`}>
                <div className={`${index < allProjects?.length - 1 ? "all-projects__border-set" : ""}`}>
                  <TeamProjectCard onEditClicked={onEditClicked}   onCardClicked={() => callback(project)} url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`} hasProjectsEditAccess={hasProjectsEditAccess} project={project} />
                </div>
              </Fragment>
            );
          })}
          {allProjects.length === 0 && (
            <div className="all-projects__projects__empty-result">
              <p>No Projects found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .all-projects {
            padding: 24px;
            width: 350px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 60vh;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .all-projects__title {
            color: #0f172a;
            font-size: 20px;
            font-weight: 700;
            line-height: 32px;
          }

          .all-projects__search-bar {
            border: 1px solid #cbd5e1;
            background: #fff;
            width: 100%;
            display: flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
          }

          .all-projects__search-bar__input {
            border: none;
            width: inherit;
            color: black;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            background: #fff;

            &:focus {
              outline: none;
            }
          }

          ::-webkit-input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          :-moz-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::-moz-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          :-ms-input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::input-placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          ::placeholder {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          .all-projects__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .all-projects__projects {
            display: flex;
            overflow: auto;
            flex-direction: column;
            flex: 1;
          }

          .all-projects__projects__empty-result {
            color: black;
          }

          .all-projects__projects__empty-result {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            display: flex;
            justify-content: center;
            letter-spacing: 0.12px;
          }

          @media (min-width: 1024px) {
            .all-projects {
              width: 600px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AllProjects;
