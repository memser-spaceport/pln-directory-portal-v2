import Image from 'next/image';
import { ChangeEvent, Fragment, useEffect, useState } from 'react';

import { IFormatedTeamProject } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import { TeamProjectCard } from '../TeamProjectCard';

import s from './AllProjects.module.scss';

interface Props {
  projects: IFormatedTeamProject[];
  hasProjectsEditAccess: boolean;
  onCardClicked: (project: IFormatedTeamProject) => void;
  onEditClicked: (project: IFormatedTeamProject) => void;
}

export function AllProjects(props: Props) {
  const { hasProjectsEditAccess, onCardClicked, onEditClicked } = props;
  const projects = props.projects ?? [];

  const [allProjects, setAllProjects] = useState(projects);
  const [searchValue, setSearchValue] = useState('');

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchValue(name);
    if (name) {
      const filteredProjects = allProjects?.filter((project: IFormatedTeamProject) =>
        project?.name?.toLowerCase()?.includes(name),
      );
      setAllProjects(filteredProjects);
    } else {
      setAllProjects(projects);
    }
  };

  useEffect(() => {
    document.addEventListener(EVENTS.TEAM_DETAIL_ALL_PROJECTS_CLOSE, (e: any) => {
      setAllProjects(projects);
      setSearchValue('');
    });
    document.removeEventListener(EVENTS.TRIGGER_LOADER, () => {});
  }, []);

  return (
    <div className={s.root}>
      <h2 className={s.title}>Projects ({projects?.length})</h2>
      <div className={s.searchBar}>
        <Image loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
        <input
          value={searchValue}
          className={s.searchInput}
          placeholder="Search"
          name="name"
          autoComplete="off"
          onChange={onInputChangeHandler}
        />
      </div>

      <div className={s.projects}>
        {allProjects?.map((project: IFormatedTeamProject, index: number) => (
          <Fragment key={`${project} + ${index}`}>
            <div className={index < allProjects?.length - 1 ? s.projectBorder : undefined}>
              <TeamProjectCard
                onEditClicked={onEditClicked}
                onCardClicked={() => onCardClicked(project)}
                url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`}
                hasProjectsEditAccess={hasProjectsEditAccess}
                project={project}
              />
            </div>
          </Fragment>
        ))}
        {allProjects.length === 0 && (
          <div className={s.emptyResult}>
            <p>No Projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
