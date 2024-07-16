'use client';

import usePagination from '../../../hooks/usePagination';
import { useRef } from 'react';
import ProjectAddCard from './project-add-card';
import { VIEW_TYPE_OPTIONS } from '@/utils/constants';

const ProjectList = (props: any) => {
  //props
  const searchParams = props.searchParams;
  const userInfo = props.userInfo;
  const children = props?.children;
  const totalProjects = props?.totalProjects;
  const isLoggedIn = props?.isLoggedIn;

  //variables
  const viewType = searchParams?.viewType ?? VIEW_TYPE_OPTIONS.GRID;
  const observerTarget = useRef(null);

  const [visibleItems] = usePagination({
    items: children,
    observerTarget,
  });

  return (
    <div className="project-list">
      <div className="project-list__titlesec">
        <h1 className="project-list__titlesec__title">Projects</h1> <div className="project-list__title__count">({totalProjects})</div>
      </div>
      <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'project-list__grid' : 'project-list__list'}`}>
        {isLoggedIn && totalProjects > 0 && <ProjectAddCard userInfo={userInfo} viewType={viewType} />}
        {visibleItems}
        <div ref={observerTarget}></div>
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
    </div>
  );
};

export default ProjectList;
