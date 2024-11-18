import { ChangeEvent, Fragment, useEffect, useState } from 'react';
import MemberDetailsRepoCard from './member-details-repo-card';

interface IAllRepos {
  allRepos: any;
  userInfo: any;
  member: any;
}
/**
 * The `AllRepositories` component displays a list of repositories with a search functionality.
 * It allows users to filter repositories by name and displays the total count of repositories.
 *
 * @component
 * @param {IAllRepos} props - The properties object.
 * @param {Array} props.allRepos - The list of all repositories.
 * @param {Object} props.userInfo - The user information object.
 * @param {Object} props.member - The member information object.
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * <AllRepositories allRepos={repositories} userInfo={user} member={member} />
 *
 * @remarks
 * This component uses the `useState` and `useEffect` hooks from React to manage state and side effects.
 * It listens for a custom event `close-member-repos-modal` to reset the search term and repository list.
 *
 * @function
 * @name AllRepositories
 */
const AllRepositories = (props: IAllRepos) => {
  const repos = props?.allRepos ?? [];

  const userInfo = props?.userInfo;
  const member = props?.member;

  const [allRepos, setAllRepos] = useState(repos);
  const [searchTerm, setSearchTerm] = useState('');
  const repositoriesLength = repos?.length ?? 0;

  const onInputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e?.target?.value?.toLowerCase();
    setSearchTerm(name);
    if (name) {
      const filterRepos = allRepos?.filter((member: any) => member?.name?.toLowerCase()?.includes(name));
      setAllRepos(filterRepos);
    } else {
      setAllRepos(repos);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filterRepos = allRepos?.filter((member: any) => member?.name?.toLowerCase()?.includes(searchTerm));
      setAllRepos(filterRepos);
    } else {
      setAllRepos(repos);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = () => {
      setAllRepos(repos);
      setSearchTerm('');
    };
    document.addEventListener('close-member-repos-modal', handler);
    return () => {
      return document.addEventListener('close-member-repos-modal', handler);
    };
  }, []);

  return (
    <>
      <div className="all-repos">
        <div className="all-repos__hdr">
          <h2 className="all-repos__title">Repositories</h2>
          <span className="all-repos__hdr__count">({repositoriesLength})</span>
        </div>
        <div className="all-repos__search-bar">
          <img loading="lazy" alt="search" src="/icons/search-gray.svg" height={20} width={20} />
          <input value={searchTerm} className="all-repos__search-bar__input" placeholder="Search" name="name" autoComplete="off" onChange={onInputChangeHandler} />
        </div>

        <div className="all-repos__container">
          {allRepos?.map((repo: any, index: number) => {
            return (
              <Fragment key={`${repo} + ${index}`}>
                <div className={`all-repos__container__repo ${index !== allRepos?.length - 1 && 'all-repos__border-set'}`}>
                  <MemberDetailsRepoCard userInfo={userInfo} memebr={member} repo={repo} />
                </div>
              </Fragment>
            );
          })}
          {allRepos?.length === 0 && (
            <div className="all-repos__container__empty-result">
              <p>No repository found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .all-repos {
            padding: 24px;
            width: 90vw;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 550px;
            overflow: auto;
            border-radius: 12px;
            background: #fff;
          }

          .all-repos__hdr {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .all-repos__hdr__count {
            margin-top: 1px;
          }

          .all-repos__title {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .all-repos__search-bar {
            border: 1px solid #cbd5e1;
            background: #fff;
            width: 100%;
            display: flex;
            height: 40px;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
          }

          .all-repos__search-bar__input {
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

          .all-repos__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .all-repos__container {
            display: flex;
            overflow: auto;
            flex-direction: column;
            flex: 1;
            overflow-x: hidden;
          }

          .all-repos__container__empty-result {
            color: black;
          }

          .all-repos__container__empty-result {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            display: flex;
            justify-content: center;
            letter-spacing: 0.12px;
          }

          .all-repos__container__repo:hover {
            background-color: #f8fafc;
          }

          @media (min-width: 1024px) {
            .all-repos {
              width: 500px;
            }
          }
        `}
      </style>
    </>
  );
};

export default AllRepositories;
