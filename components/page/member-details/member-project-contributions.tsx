import { ChangeEvent, Fragment, useEffect, useState } from 'react';
import MemberProjectExperienceCard from './member-project-experience-card';

interface IAllProjectExperience {
  contributions: any;
}
const MemberProjectContributions = (props: IAllProjectExperience) => {
  const contributions = props?.contributions ?? [];
  const [allContributions, setAllContributions] = useState(contributions);
  const [searchTerm, setSearchTerm] = useState('');

  const contributionsLength = contributions.length ?? 0;

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchTerm(name);
  };

  useEffect(() => {
    if (searchTerm) {
      const filteredContributions = allContributions?.filter((contribution: any) => contribution?.project?.name?.toLowerCase()?.includes(searchTerm));
      setAllContributions(filteredContributions);
    } else {
      setAllContributions(contributions);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = () => {
      setAllContributions(contributions);
      setSearchTerm('');
    };
    document.addEventListener('close-member-projects-modal', handler);
    return () => {
      return document.addEventListener('close-member-projects-modal', handler);
    };
  }, []);

  return (
    <>
      <div className="project-contributions">
        <div className="project-contributions__hdr">
          <h2 className="project-contributions__title">Project Contributions</h2>
          <span className='project-contributions__hdr__count'>({contributionsLength})</span>
        </div>
        <div className="project-contributions__search-bar">
          <img loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
          <input value={searchTerm} className="project-contributions__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="project-contributions__container">
          {allContributions?.map((repo: any, index: number) => {
            return (
              <Fragment key={`${repo} + ${index}`}>
                <div className={`project-contributions__container__repo ${allContributions?.length - 1 !== index ? 'project-contributions__border-set' : ''}`}>
                  <MemberProjectExperienceCard experience={repo} />
                </div>
              </Fragment>
            );
          })}
          {allContributions.length === 0 && (
            <div className="project-contributions__container__empty-result">
              <p>No repository found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .project-contributions {
            padding: 24px;
            width: 90vw;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 550px;
            border-radius: 12px;
            background: #fff;
          }

          .project-contributions__container__repo:hover {
            background-color: #f8fafc;
          }

          .project-contributions__hdr__count {
          margin-top:1px;
          }

          .project-contributions__hdr {
            display: flex;
            gap: 4px;
            align-items:center;
          }

          .project-contributions__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .project-contributions__search-bar {
            border: 1px solid #cbd5e1;
            background: #fff;
            width: 100%;
            display: flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
          }

          .project-contributions__search-bar__input {
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

          .project-contributions__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .project-contributions__container {
            display: flex;
            overflow: auto;
            flex-direction: column;
            flex: 1;
            overflow-x: hidden;
          }

          .project-contributions__container__empty-result {
            color: black;
          }

          .project-contributions__container__empty-result {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            display: flex;
            justify-content: center;
            letter-spacing: 0.12px;
          }

          .project-contributions__container__repo {
            padding: 16px;
          }

          @media (min-width: 1024px) {
            .project-contributions {
              width: 500px;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberProjectContributions;
